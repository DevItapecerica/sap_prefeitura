import assert from "node:assert/strict";
import test from "node:test";
import { Transaction } from "sequelize";
import type { DbObject } from "../../../../../core/types/DbTypes.js";
import { SequelizeStockRepository } from "../sequelize.estoque.repository.js";

test("resolving the aggregate does not establish a transaction snapshot before stock locks", async () => {
  const transaction = { LOCK: { UPDATE: "UPDATE" } } as Transaction;
  const calls: string[] = [];
  const db = {
    BolsistasEdital: {
      findByPk: async (
        _id: string,
        options?: { transaction: Transaction; lock: string },
      ) => {
        if (!options) {
          calls.push("seed without snapshot");
          return { id: "participation", edital_id: "program" };
        }
        assert.equal(options.transaction, transaction);
        assert.equal(options.lock, "UPDATE");
        calls.push("participation lock");
        return { id: "participation", edital_id: "program" };
      },
    },
    Edital: {
      findByPk: async (
        _id: string,
        options: { transaction: Transaction; lock: string },
      ) => {
        assert.equal(options.transaction, transaction);
        assert.equal(options.lock, "UPDATE");
        calls.push("program lock");
        return { id: "program" };
      },
    },
  } as unknown as DbObject;
  await new SequelizeStockRepository(db, transaction).lockParticipant(
    "participation",
  );
  assert.deepEqual(calls, [
    "seed without snapshot",
    "program lock",
    "participation lock",
  ]);
});
