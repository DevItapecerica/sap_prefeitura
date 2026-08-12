import assert from "node:assert/strict";
import test from "node:test";
import { QueryInterface } from "sequelize";
import migration from "../20260811150000-create-protocolo-geral.js";

const tables = ["protocol_services", "protocol_forms", "protocol_counters", "protocols", "protocol_movements", "protocol_requirements", "protocol_attachments", "protocol_access_codes"];

test("migration central reconcilia schema completo já existente", async () => {
  let creates = 0;
  const queryInterface = {
    sequelize: { query: async () => tables.map((TABLE_NAME) => ({ TABLE_NAME })) },
    createTable: async () => { creates += 1; },
  } as unknown as QueryInterface;
  await migration.up(queryInterface);
  assert.equal(creates, 0);
});

test("migration central rejeita schema parcial em vez de ocultar drift", async () => {
  const queryInterface = {
    sequelize: { query: async () => [{ TABLE_NAME: "protocols" }] },
  } as unknown as QueryInterface;
  await assert.rejects(() => migration.up(queryInterface), /Partial Protocolo Geral schema/);
});
