import assert from "node:assert/strict";
import test from "node:test";
import { allocateProtocolNumber } from "../protocol-number.js";

test("numeração anual incrementa atomicamente e lê o contador com lock", async () => {
  const transaction = { LOCK: { UPDATE: "UPDATE" } } as any;
  const calls: Array<[string, unknown]> = [];
  const model = {
    sequelize: { async query(sql: string, options: unknown) { calls.push([sql, options]); } },
    getTableName: () => "protocol_counters",
    async findByPk(year: number, options: unknown) { calls.push(["findByPk", { year, options }]); return { value: 42 }; },
  };

  const number = await allocateProtocolNumber(model, transaction, new Date(2026, 5, 1));

  assert.equal(number, "2026/000042");
  assert.match(String(calls[0][0]), /ON DUPLICATE KEY UPDATE/);
  assert.deepEqual(calls[0][1], { replacements: { year: 2026 }, transaction });
  assert.deepEqual(calls[1], ["findByPk", { year: 2026, options: { transaction, lock: "UPDATE" } }]);
});

test("numeração anual inicia sequência independente no ano novo", async () => {
  const transaction = { LOCK: { UPDATE: "UPDATE" } } as any;
  const model = {
    sequelize: { async query() {} },
    getTableName: () => ({ tableName: "protocol_counters" }),
    async findByPk() { return { value: 1 }; },
  };

  assert.equal(await allocateProtocolNumber(model, transaction, new Date(2027, 0, 1)), "2027/000001");
});

test("numeração rejeita nome de tabela não confiável", async () => {
  const model = { sequelize: { async query() {} }, getTableName: () => "counter; DROP TABLE protocols", async findByPk() { return { value: 1 }; } };
  await assert.rejects(() => allocateProtocolNumber(model, { LOCK: { UPDATE: "UPDATE" } } as any), /Invalid protocol counter table name/);
});
