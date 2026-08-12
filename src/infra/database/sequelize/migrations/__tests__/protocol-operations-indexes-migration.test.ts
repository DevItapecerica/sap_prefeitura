import assert from "node:assert/strict";
import test from "node:test";
import { QueryInterface } from "sequelize";
import migration from "../20260812121000-add-protocol-operations-indexes.js";

test("migration operacional cria índices idempotentes e os reverte explicitamente", async () => {
  const existing = new Set<string>();
  const additions: string[] = [];
  const drops: string[] = [];
  const queryInterface = {
    sequelize: { query: async (sql: string, options?: any) => {
      if (options?.type) return [{ present: existing.has(options.replacements.name) ? 1 : 0 }];
      drops.push(sql);
      const name = sql.match(/DROP INDEX `([^`]+)`/)?.[1];
      if (name) existing.delete(name);
      return [];
    } },
    addIndex: async (_table: string, _fields: string[], options: { name: string }) => {
      additions.push(options.name);
      existing.add(options.name);
    },
  } as unknown as QueryInterface;

  await migration.up(queryInterface);
  await migration.up(queryInterface);
  assert.equal(additions.length, 5);
  assert.ok(additions.includes("idx_protocols_state_due_at"));
  await migration.down(queryInterface);
  assert.equal(drops.length, 5);
  assert.equal(existing.size, 0);
});
