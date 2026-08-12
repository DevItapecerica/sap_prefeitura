import assert from "node:assert/strict";
import test from "node:test";
import { QueryInterface } from "sequelize";
import migration from "../20260811160000-create-protocol-role-permissions.js";

test("migration de capacidades é reversível e referencia papéis", async () => {
  let table = "";
  let columns: Record<string, any> = {};
  const dropped: string[] = [];
  const queryInterface = {
    sequelize: { query: async () => [{ present: 0 }] },
    createTable: async (name: string, definition: Record<string, any>) => { table = name; columns = definition; },
    dropTable: async (name: string) => { dropped.push(name); },
  } as unknown as QueryInterface;

  await migration.up(queryInterface);
  await migration.down(queryInterface);

  assert.equal(table, "protocol_role_permissions");
  assert.equal(columns.role_id.references.model, "roles");
  assert.deepEqual(["manage_catalog", "triage", "route", "decide", "view_sector", "export"].every((key) => key in columns), true);
  assert.deepEqual(dropped, ["protocol_role_permissions"]);
});

test("migration de capacidades reconcilia tabela já existente", async () => {
  let creates = 0;
  const queryInterface = {
    sequelize: { query: async () => [{ present: 1 }] },
    createTable: async () => { creates += 1; },
  } as unknown as QueryInterface;
  await migration.up(queryInterface);
  assert.equal(creates, 0);
});
