import assert from "node:assert/strict";
import test from "node:test";
import { QueryInterface } from "sequelize";
import migration from "../20260812120000-add-protocol-operations-permission.js";

test("migration da operação é idempotente, concede contingência ao admin e reverte", async () => {
  let exists = false; let additions = 0; const statements: string[] = [];
  const queryInterface = {
    sequelize: { query: async (sql: string, options?: any) => {
      if (options?.type) return [{ present: exists ? 1 : 0 }];
      statements.push(sql);
      if (sql.includes("DROP COLUMN")) exists = false;
      return [];
    } },
    addColumn: async () => { additions += 1; exists = true; },
  } as unknown as QueryInterface;
  await migration.up(queryInterface); await migration.up(queryInterface);
  assert.equal(additions, 1);
  assert.ok(statements.some((sql) => sql.includes("view_operations = TRUE")));
  await migration.down(queryInterface);
  assert.equal(exists, false);
});
