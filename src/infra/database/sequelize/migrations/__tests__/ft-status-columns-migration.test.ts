import assert from "node:assert/strict";
import test from "node:test";
import { QueryInterface } from "sequelize";
import migration from "../20260630100000-add-status-date-columns-bolsistas-edital.js";

test("rollback das datas de status remove colunas sem introspecção instável", async () => {
  const removed: string[] = [];
  const queryInterface = {
    sequelize: { transaction: async (callback: (transaction: object) => Promise<void>) => callback({}) },
    describeTable: async () => { throw new Error("down não deve introspectar a tabela"); },
    removeColumn: async (_table: string, column: string) => { removed.push(column); },
  } as unknown as QueryInterface;

  await migration.down(queryInterface);
  assert.deepEqual(removed, ["expired_at", "concluded_at", "canceled_at"]);
});
