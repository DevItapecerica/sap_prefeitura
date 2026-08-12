import assert from "node:assert/strict";
import test from "node:test";
import { QueryInterface } from "sequelize";
import migration from "../20260811162000-create-protocol-notifications.js";

test("migration corretiva cria notificações uma única vez e é reversível", async () => {
  let exists = false;
  let creates = 0;
  let indexes = 0;
  let drops = 0;
  const queryInterface = {
    sequelize: { query: async () => [{ present: exists ? 1 : 0 }] },
    createTable: async () => { creates += 1; exists = true; },
    addIndex: async () => { indexes += 1; },
    dropTable: async () => { drops += 1; exists = false; },
  } as unknown as QueryInterface;

  await migration.up(queryInterface);
  await migration.up(queryInterface);
  await migration.down(queryInterface);

  assert.deepEqual({ creates, indexes, drops, exists }, { creates: 1, indexes: 1, drops: 1, exists: false });
});
