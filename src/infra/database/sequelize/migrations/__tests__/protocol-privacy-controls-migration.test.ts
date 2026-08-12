import assert from "node:assert/strict";
import test from "node:test";
import { QueryInterface } from "sequelize";
import migration from "../20260812100000-create-protocol-privacy-controls.js";

test("migration de privacidade é idempotente, concede administração e reverte seus artefatos", async () => {
  const tables = new Set(["protocols", "protocol_role_permissions"]);
  const columns = new Set<string>();
  const indexes: string[] = [];
  const statements: string[] = [];
  let creates = 0;
  let drops = 0;
  const queryInterface = {
    sequelize: {
      query: async (sql: string, options?: any) => {
        if (options?.replacements?.column) return [{ present: columns.has(`${options.replacements.table}.${options.replacements.column}`) ? 1 : 0 }];
        if (options?.replacements?.table) return [{ present: tables.has(options.replacements.table) ? 1 : 0 }];
        statements.push(sql);
        const match = sql.match(/ALTER TABLE `([^`]+)` DROP COLUMN `([^`]+)`/);
        if (match) columns.delete(`${match[1]}.${match[2]}`);
        return [];
      },
    },
    addColumn: async (table: string, column: string) => { columns.add(`${table}.${column}`); },
    createTable: async (table: string) => { creates += 1; tables.add(table); },
    addIndex: async (_table: string, _columns: string[], options: any) => { indexes.push(options.name); },
    dropTable: async (table: string) => { drops += 1; tables.delete(table); },
  } as unknown as QueryInterface;

  await migration.up(queryInterface);
  await migration.up(queryInterface);

  assert.equal(creates, 1);
  assert.deepEqual(indexes, ["idx_protocol_privacy_requests_citizen", "idx_protocol_privacy_requests_status"]);
  assert.ok(columns.has("protocols.privacy_notice_version"));
  assert.ok(columns.has("protocol_role_permissions.manage_privacy"));
  assert.ok(statements.some((sql) => sql.includes("SET manage_privacy = TRUE WHERE role_id = 1")));

  await migration.down(queryInterface);
  assert.equal(drops, 1);
  assert.equal(tables.has("protocol_privacy_requests"), false);
  assert.equal(columns.size, 0);
});
