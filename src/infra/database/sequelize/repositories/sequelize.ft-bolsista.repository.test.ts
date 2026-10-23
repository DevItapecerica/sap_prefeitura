import assert from "node:assert/strict";
import test from "node:test";
import db from "../index.js";
import { SequelizeFtBolsistaRepository } from "./sequelize.ft-bolsista.repository.js";

const model = (values: Record<string, any>) => ({
  get: (key: string) => values[key],
  set: (updates: Record<string, any>) => Object.assign(values, updates),
  setDataValue: (key: string, value: any) => { values[key] = value; },
  toJSON: () => ({ ...values }),
  save: async () => values,
  destroy: async () => undefined,
});

const patchMethod = (
  target: any,
  key: string,
  replacement: (...args: any[]) => any,
) => {
  const original = target[key];
  target[key] = replacement;
  return () => { target[key] = original; };
};

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

test("executa persistencia e transacoes do agregado de bolsista", async () => {
  const repository = new SequelizeFtBolsistaRepository();
  const calls: string[] = [];
  const bolsista = model({ id: "b1", municipe: null });
  const paymentInfo = model({ bolsista_id: "b1" });
  const vinculo = model({ expire_at: "2026-10-01", status: "ativo" });
  const falta = model({ id: "f1" });
  const ocorrencia = model({ id: "o1" });
  const restores = [
    patchMethod(db.sequelize, "transaction", async (callback) => callback({ id: "tx" })),
    patchMethod(db.Bolsistas, "findByPk", async (id) => id === "missing" ? null : bolsista),
    patchMethod(db.Bolsistas, "findOne", async () => bolsista),
    patchMethod(db.Bolsistas, "create", async (data) => { calls.push("bolsista:create"); return model({ id: "b1", ...data }); }),
    patchMethod(db.MunicipeModel, "findByPk", async () => model({ uuid: "m1" })),
    patchMethod(db.PaymentInfo, "create", async (data) => { calls.push(`payment:${data.bolsista_id ?? "direto"}`); return paymentInfo; }),
    patchMethod(db.Edital, "findByPk", async () => model({ id: "e1" })),
    patchMethod(db.BolsistasEdital, "findOne", async () => vinculo),
    patchMethod(db.BolsistasEdital, "findByPk", async () => vinculo),
    patchMethod(db.BolsistaFalta, "findOne", async () => falta),
    patchMethod(db.BolsistaFalta, "create", async () => falta),
    patchMethod(db.BolsistaFalta, "findByPk", async () => falta),
    patchMethod(db.BolsistaOcorrencia, "create", async () => ocorrencia),
    patchMethod(db.BolsistaOcorrencia, "findByPk", async () => ocorrencia),
  ];

  try {
    assert.equal(await repository.findById("missing"), null);
    assert.equal(await repository.findById("b1"), bolsista);
    assert.equal(await repository.findByMunicipeUuid("m1"), bolsista);
    assert.equal((await repository.findMunicipeById("m1"))?.get("uuid"), "m1");
    await repository.create({ municipe_uuid: "m1" });
    await repository.createPaymentInfo({ bolsista_id: "b1" });
    const created = await repository.createWithPaymentInfo(
      { municipe_uuid: "m1" },
      { banco: "001" },
    );
    assert.equal(created.bolsista.get("id"), "b1");
    assert.deepEqual(calls, ["bolsista:create", "payment:b1", "bolsista:create", "payment:b1"]);
    assert.equal(await repository.updateWithPaymentInfo(bolsista, paymentInfo, { banco: "104" }), bolsista);
    assert.equal((await repository.findEditalById("e1"))?.get("id"), "e1");
    assert.equal(await repository.findVinculo("b1", "e1", "ativo"), vinculo);
    assert.equal(await repository.findVinculo("b1", "e1"), vinculo);
    assert.equal(await repository.findVinculoById("v1"), vinculo);
    assert.equal(await repository.findFaltaByBolsistaEditalData("b1", "e1", "2026-10-01"), falta);
    await repository.destroyBolsista(bolsista);
    await repository.cancelVinculo(bolsista, vinculo, "Encerrado");
    assert.equal(vinculo.get("status"), "cancelado");
    await repository.prorrogateVinculos([vinculo]);
    assert.equal(vinculo.get("prorrogated"), true);
    assert.equal((vinculo.get("expire_at") as Date).getFullYear(), 2027);
    assert.equal(await repository.createFalta({}), falta);
    assert.equal(await repository.findFaltaById("f1"), falta);
    await repository.destroyFalta(falta);
    assert.equal(await repository.createOcorrencia({}), ocorrencia);
    assert.equal(await repository.findOcorrenciaById("o1"), ocorrencia);
    await repository.destroyOcorrencia(ocorrencia);
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

test("monta consultas de faltas, ocorrencias e historicos", async () => {
  const repository = new SequelizeFtBolsistaRepository();
  const received: Record<string, any> = {};
  const history = model({
    id: "v1",
    turno: model({ nome: "Atual", hora_inicio: "09:00", hora_fim: "15:00" }),
    turno_nome_snapshot: "Historico",
    turno_hora_inicio_snapshot: "08:00",
    turno_hora_fim_snapshot: "14:00",
  });
  const simpleRow = model({ id: "b1", municipe: null, bolsistas_edital: [] });
  let bolsistasQuery = 0;
  const restores = [
    patchMethod(db.Bolsistas, "findAll", async (options) => {
      received[`bolsistas:${bolsistasQuery++}`] = options;
      return [simpleRow];
    }),
    patchMethod(db.Bolsistas, "findAndCountAll", async (options) => {
      received.expire = options;
      return { count: 1, rows: [simpleRow] };
    }),
    patchMethod(db.BolsistasEdital, "findAll", async (options) => {
      received.history = options;
      return [history];
    }),
    patchMethod(db.BolsistaFalta, "findAndCountAll", async (options) => {
      received.faltas = options;
      return { count: 1, rows: [] };
    }),
    patchMethod(db.BolsistaFalta, "findAll", async (options) => {
      received.periodo = options;
      return [];
    }),
    patchMethod(db.BolsistaOcorrencia, "findAndCountAll", async (options) => {
      received.ocorrencias = options;
      return { count: 1, rows: [] };
    }),
  ];

  try {
    assert.equal((await repository.findAniversariantesAtivos()).length, 1);
    assert.equal((await repository.findToExpire(new Date("2026-11-01"))).count, 1);
    assert.equal((await repository.findByEditalId("e1")).length, 1);
    const rows = await repository.findHistoricoByBolsistaId("b1");
    assert.equal(rows[0].get("turno").nome, "Historico");
    await repository.findAndCountFaltasByBolsista("b1", {
      edital_id: "e1",
      data_inicio: "2026-10-01",
      data_fim: "2026-10-31",
      page: "2",
      limit: "5",
    });
    assert.equal(received.faltas.offset, 10);
    assert.equal(received.faltas.where.edital_id, "e1");
    await repository.findAndCountFaltasByBolsista("b1");
    await repository.findFaltasByBolsistaPeriodo("b1", "e1", "2026-10-01", "2026-10-31");
    await repository.findAndCountOcorrenciasByBolsista("b1", {
      edital_id: "e1",
      bolsista_edital_id: "v1",
      page: "1",
      limit: "20",
    });
    assert.equal(received.ocorrencias.offset, 20);
    assert.deepEqual(received.ocorrencias.include[0].where, {
      bolsista_id: "b1",
      id: "v1",
      edital_id: "e1",
    });
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

test("pagina candidatos elegiveis com cursor opaco", async () => {
  const repository = new SequelizeFtBolsistaRepository();
  (repository as any).municipeMapper = {
    toDomain: async (value: any) => value,
  };
  const candidate = (id: string, nome: string, vinculos: any[] = []) =>
    model({
      id,
      municipe: model({ nome, nascimento: "1990-05-10" }),
      bolsistas_edital: vinculos,
    });
  const rows = [candidate("b1", "Ana"), candidate("b2", "Bia")];
  const restoreEdital = patchMethod(db.Edital, 'findByPk', async () => model({ id: 'e1', idade_maxima: 65, permitir_retorno: true, permitir_participacao_anterior: true }));
  let calls = 0;
  const restore = patchMethod(db.Bolsistas, "findAll", async () => calls++ === 0 ? rows : []);

  try {
    await assert.rejects(
      () => repository.findAndCountVinculoCandidates({ edital_id: "e1", data_vinculo: "2026-10-01", limit: "0" }),
      (error: any) => error.statusCode === 400,
    );
    await assert.rejects(
      () => repository.findAndCountVinculoCandidates({ edital_id: "e1", data_vinculo: "2026-10-01", cursor: "invalido" }),
      (error: any) => error.statusCode === 400,
    );
    const first = await repository.findAndCountVinculoCandidates({
      edital_id: "e1",
      data_vinculo: "2026-10-01",
      limit: "1",
      search: "a",
    });
    assert.equal(first.rows.length, 1);
    assert.equal(first.hasMore, true);
    assert.ok(first.nextCursor);
    const second = await repository.findAndCountVinculoCandidates({
      edital_id: "e1",
      data_vinculo: "2026-10-01",
      limit: "1",
      cursor: first.nextCursor!,
    });
    assert.equal(second.rows.length, 0);
    assert.equal(second.nextCursor, null);
  } finally {
    restoreEdital();
    restore();
  }
});

test("ignora candidatos inelegiveis e aceita somente quem atende as politicas", async () => {
  const repository = new SequelizeFtBolsistaRepository();
  (repository as any).municipeMapper = {
    toDomain: async (value: any) => value,
  };
  const candidate = (
    id: string,
    nascimento: string | null,
    vinculos: any[] = [],
  ) => model({
    id,
    municipe: model({ nome: id, nascimento }),
    bolsistas_edital: vinculos,
  });
  const rows = [
    candidate("ativo", "1990-01-01", [model({ edital_id: "outro", status: "ativo" })]),
    candidate("retorno-mesmo-mes", "1990-01-01", [model({ edital_id: "e1", status: "cancelado", ativado_em: '2026-09-01', canceled_at: "2026-10-02" })]),
    candidate("sem-nascimento", null),
    candidate("data-invalida", "invalida"),
    candidate("idade-excedida", "1950-01-01"),
    candidate("elegivel", "1990-01-01"),
  ];
  const restore = patchMethod(db.Bolsistas, "findAll", async () => rows);
  const restoreEdital = patchMethod(db.Edital, 'findByPk', async () => model({ id: 'e1', idade_maxima: 65, permitir_retorno: true, permitir_participacao_anterior: true }));

  try {
    const result = await repository.findAndCountVinculoCandidates({
      edital_id: "e1",
      data_vinculo: "2026-10-20",
      limit: "10",
    });
    assert.deepEqual(result.rows.map((row: any) => row.get("id")), ["elegivel"]);
    assert.equal(result.hasMore, false);
    assert.equal(result.nextCursor, null);
  } finally {
    restoreEdital();
    restore();
  }
});

test("hidrata municipe e cobre buscas sem texto e por CPF", async () => {
  const repository = new SequelizeFtBolsistaRepository();
  (repository as any).municipeMapper = {
    toDomain: async (value: any) => ({ ...value, nome: "Nome descriptografado" }),
  };
  const row = model({
    id: "b1",
    municipe: model({ nome: "cifrado" }),
    bolsistas_edital: [],
  });
  const queries: any[] = [];
  const restores = [
    patchMethod(db.Bolsistas, "findByPk", async () => row),
    patchMethod(db.Bolsistas, "findAndCountAll", async (options) => {
      queries.push(options);
      return { count: 0, rows: [] };
    }),
  ];

  try {
    const found = await repository.findById("b1");
    assert.equal(found?.get("municipe").nome, "Nome descriptografado");
    await repository.findAndCount({ search: "" });
    await repository.findAndCount({ search: "529.982.247-25" });
    assert.equal(queries[0].include[0].where, undefined);
    assert.equal(queries[1].include[0].where[Object.getOwnPropertySymbols(queries[1].include[0].where)[0]].length, 2);
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});
