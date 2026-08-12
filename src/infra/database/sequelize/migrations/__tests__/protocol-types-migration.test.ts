import assert from "node:assert/strict";
import test from "node:test";
import { QueryInterface } from "sequelize";
import migration from "../20260812110000-add-protocol-types.js";

test("migration de tipos é idempotente, protege o vínculo de recurso e reverte", async () => {
  const columns = new Set<string>();
  const constraints = new Set<string>();
  const statements: string[] = [];
  const queryInterface = {
    sequelize: { query: async (sql: string, options?: any) => {
      if (options?.replacements?.column) return [{ present: columns.has(`${options.replacements.table}.${options.replacements.column}`) ? 1 : 0 }];
      if (options?.replacements?.constraint) return [{ present: constraints.has(`${options.replacements.table}.${options.replacements.constraint}`) ? 1 : 0 }];
      statements.push(sql);
      const dropColumn = sql.match(/ALTER TABLE `([^`]+)` DROP COLUMN `([^`]+)`/);
      if (dropColumn) columns.delete(`${dropColumn[1]}.${dropColumn[2]}`);
      const dropConstraint = sql.match(/ALTER TABLE `([^`]+)` DROP FOREIGN KEY `([^`]+)`/);
      if (dropConstraint) constraints.delete(`${dropConstraint[1]}.${dropConstraint[2]}`);
      return [];
    } },
    addColumn: async (table: string, column: string) => { columns.add(`${table}.${column}`); },
    addConstraint: async (table: string, options: any) => { constraints.add(`${table}.${options.name}`); },
  } as unknown as QueryInterface;

  await migration.up(queryInterface);
  const firstColumnCount = columns.size;
  await migration.up(queryInterface);
  assert.equal(columns.size, firstColumnCount);
  assert.ok(columns.has("protocol_services.protocol_type"));
  assert.ok(columns.has("protocols.related_protocol_id"));
  assert.ok(columns.has("protocol_role_permissions.view_restricted"));
  assert.ok(constraints.has("protocols.protocols_related_protocol_fk"));
  assert.ok(statements.some((sql) => sql.includes("view_restricted = TRUE")));

  await migration.down(queryInterface);
  assert.equal(columns.size, 0);
  assert.equal(constraints.size, 0);
});
