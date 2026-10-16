import assert from "node:assert/strict";
import test from "node:test";
import db from "../index.js";
import { SequelizeFtBolsistaRepository } from "./sequelize.ft-bolsista.repository.js";

const model = (values: Record<string, any>) => ({
  get: (key: string) => values[key],
  setDataValue: (key: string, value: any) => { values[key] = value; },
  toJSON: () => ({ ...values }),
});

test("pagina bolsistas antes de carregar seus multiplos vinculos", async () => {
  const original = db.Bolsistas.findAndCountAll;
  let received: any;
  (db.Bolsistas as any).findAndCountAll = async (options: any) => {
    received = options;
    return {
      count: 23,
      rows: Array.from({ length: 10 }, (_, index) => model({
        id: `b${index}`,
        municipe: null,
        bolsistas_edital: [
          model({ id: `v${index}-old`, edital_id: "e1", status: "expirado", data_vinculo: "2026-09-01", edital: { id: "e1", name: "Edital" } }),
          model({ id: `v${index}-active`, edital_id: "e1", status: "ativo", data_vinculo: "2026-01-01", edital: { id: "e1", name: "Edital" } }),
        ],
      })),
    };
  };

  try {
    const result = await new SequelizeFtBolsistaRepository().findAndCount({
      page: 1,
      limit: 10,
      search: "Maria",
    });

    assert.equal(result.count, 23);
    assert.equal(result.rows.length, 10);
    assert.equal(received.offset, 10);
    assert.equal(received.limit, 10);
    assert.equal(received.subQuery, undefined);
    assert.equal(received.include.some((include: any) => include.as === "edital"), false);
    assert.equal(received.include.find((include: any) => include.as === "bolsistas_edital")?.separate, true);
    const first = result.rows[0].toJSON();
    assert.equal(first.bolsistas_edital.length, 2);
    assert.equal(first.edital.length, 1);
    assert.equal(first.edital[0].BolsistasEdital.status, "ativo");
    assert.equal(first.vinculo_atual.status, "ativo");
  } finally {
    (db.Bolsistas as any).findAndCountAll = original;
  }
});
