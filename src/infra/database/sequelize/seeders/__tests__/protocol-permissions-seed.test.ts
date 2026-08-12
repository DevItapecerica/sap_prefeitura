import assert from "node:assert/strict";
import test from "node:test";
import { QueryInterface } from "sequelize";
import seed from "../20260811161000-seed-protocol-role-permissions.js";

test("seed concede capacidades apenas ao administrador e é idempotente", async () => {
  const rows = new Map<number, any>();
  const queryInterface = {
    sequelize: {
      transaction: async (callback: (transaction: object) => Promise<void>) => callback({}),
      query: async () => [{ id: 1, name: "admin" }, { id: 2, name: "tecnico" }],
    },
    rawSelect: async (_table: string, options: any) => rows.has(options.where.role_id) ? options.where.role_id : null,
    bulkInsert: async (_table: string, values: any[]) => values.forEach((value) => rows.set(value.role_id, value)),
  } as unknown as QueryInterface;

  await seed.up(queryInterface);
  await seed.up(queryInterface);

  assert.equal(rows.size, 2);
  assert.equal(rows.get(1).manage_catalog, true);
  assert.equal(rows.get(1).decide, true);
  assert.equal(rows.get(1).manage_privacy, true);
  assert.equal(rows.get(1).view_restricted, true);
  assert.equal(rows.get(1).view_operations, true);
  assert.equal(rows.get(2).view_sector, false);
  assert.equal(rows.get(2).route, false);
  assert.equal(rows.get(2).manage_privacy, false);
  assert.equal(rows.get(2).view_restricted, false);
  assert.equal(rows.get(2).view_operations, false);
});
