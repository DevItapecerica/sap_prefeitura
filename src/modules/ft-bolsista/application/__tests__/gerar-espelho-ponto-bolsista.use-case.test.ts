import assert from "node:assert/strict";
import test from "node:test";
import { GerarEspelhoPontoBolsistaUseCase } from "../use-case/gerar-espelho-ponto-bolsista.use-case.js";

const model = (value: any) => ({ toJSON: () => value });
const baseRepository = {
  findById: async () => model({ id: "b1", nome: "Maria", local: "Parque", logradouro: "Rua A", numero: "10", bairro: "Centro", cidade: "Itapecerica", uf: "SP" }),
  findEditalById: async () => model({ id: "e1", name: "Edital 2026" }),
  findHistoricoByBolsistaId: async () => [model({
    edital_id: "e1",
    data_vinculo: "2026-05-10",
    expire_at: "2026-06-20",
    turno: { nome: "Manhã", hora_inicio: "08:00:00", hora_fim: "14:00:00" },
  })],
  findFaltasByBolsistaPeriodo: async () => [model({ data_falta: "2026-05-12", observacao: "Ausência justificada" })],
} as any;

test("monta frequência mensal respeitando vínculo, fins de semana e faltas", async () => {
  let sent: any;
  const gateway = { execute: async (data: any) => { sent = data; return { file: Buffer.from("%PDF"), contentType: "application/pdf", contentDisposition: "inline" }; } };
  await new GerarEspelhoPontoBolsistaUseCase(baseRepository, gateway as any).execute("b1", "e1", "2026-05");
  assert.equal(sent.servidor.horario, "08:00 14:00");
  assert.equal(sent.dias.find((day: any) => day.data === "2026-05-11").horarioPrevisto, "08:00 14:00");
  assert.equal(sent.dias.find((day: any) => day.data === "2026-05-09").situacao, "Fora do vínculo");
  assert.equal(sent.dias.find((day: any) => day.data === "2026-05-10").situacao, "DSR");
  assert.equal(sent.dias.find((day: any) => day.data === "2026-05-12").situacao, "Falta");
  assert.deepEqual(sent.dias.find((day: any) => day.data === "2026-05-12").apontamentos, ["Ausência justificada"]);
  assert.equal(sent.totais.faltas, "1");
});

test("rejeita mês inválido, recursos ausentes e vínculo sem interseção", async () => {
  const gateway = { execute: async () => ({}) } as any;
  await assert.rejects(() => new GerarEspelhoPontoBolsistaUseCase(baseRepository, gateway).execute("b1", "e1", "2026-13"), (e: any) => e.statusCode === 400);
  await assert.rejects(() => new GerarEspelhoPontoBolsistaUseCase({ ...baseRepository, findById: async () => null }, gateway).execute("b1", "e1", "2026-05"), (e: any) => e.statusCode === 404);
  await assert.rejects(() => new GerarEspelhoPontoBolsistaUseCase({ ...baseRepository, findHistoricoByBolsistaId: async () => [model({ edital_id: "e1", data_vinculo: "2027-01-01" })] }, gateway).execute("b1", "e1", "2026-05"), (e: any) => e.statusCode === 409);
});

test("seleciona o vinculo que cobre o mes e preserva o snapshot do turno", async () => {
  let sent: any;
  const repository = {
    ...baseRepository,
    findHistoricoByBolsistaId: async () => [
      model({ edital_id: "e1", data_vinculo: "2026-07-01", expire_at: "2027-07-01", turno: { hora_inicio: "10:00", hora_fim: "16:00" } }),
      model({ edital_id: "e1", data_vinculo: "2026-01-01", concluded_at: "2026-05-31", turno_nome_snapshot: "Original", turno_hora_inicio_snapshot: "08:00", turno_hora_fim_snapshot: "14:00", turno: { hora_inicio: "09:00", hora_fim: "15:00" } }),
    ],
  };
  const gateway = { execute: async (data: any) => { sent = data; return {}; } };
  await new GerarEspelhoPontoBolsistaUseCase(repository as any, gateway as any).execute("b1", "e1", "2026-05");
  assert.equal(sent.servidor.horario, "08:00 14:00");
});

test("valida edital, existencia do vinculo e sobreposicao no mes", async () => {
  const gateway = { execute: async () => ({}) } as any;
  await assert.rejects(
    () => new GerarEspelhoPontoBolsistaUseCase(
      { ...baseRepository, findEditalById: async () => null } as any,
      gateway,
    ).execute("b1", "e1", "2026-05"),
    (error: any) => error.statusCode === 404,
  );
  await assert.rejects(
    () => new GerarEspelhoPontoBolsistaUseCase(
      { ...baseRepository, findHistoricoByBolsistaId: async () => [] } as any,
      gateway,
    ).execute("b1", "e1", "2026-05"),
    (error: any) => error.statusCode === 404,
  );
  const overlapping = model({ edital_id: "e1", data_vinculo: "2026-05-01", expire_at: "2026-05-31" });
  await assert.rejects(
    () => new GerarEspelhoPontoBolsistaUseCase(
      { ...baseRepository, findHistoricoByBolsistaId: async () => [overlapping, overlapping] } as any,
      gateway,
    ).execute("b1", "e1", "2026-05"),
    (error: any) => error.statusCode === 409 && /multiplos/.test(error.message),
  );
});

test("aplica fallbacks de identificacao, edital, turno e faltas sem data", async () => {
  let sent: any;
  const repository = {
    ...baseRepository,
    findById: async () => ({ municipe: { nome: "" } }),
    findEditalById: async () => ({}),
    findHistoricoByBolsistaId: async () => [{
      edital_id: "e1",
      data_vinculo: new Date("2026-05-01T00:00:00.000Z"),
      expire_at: "2026-05-31",
      turno: null,
    }],
    findFaltasByBolsistaPeriodo: async () => [
      { data_falta: null, observacao: "Ignorada" },
      { data_falta: "2026-05-11", observacao: null },
    ],
  };
  const gateway = { execute: async (data: any) => { sent = data; return {}; } };

  await new GerarEspelhoPontoBolsistaUseCase(repository as any, gateway as any)
    .execute("b1", "e1", "2026-05");

  assert.match(sent.name, /b1/);
  assert.equal(sent.servidor.matricula, "b1");
  assert.equal(sent.servidor.horario, "Não informado");
  assert.equal(sent.observacoes, "Edital: e1");
  assert.deepEqual(sent.dias.find((day: any) => day.data === "2026-05-11").apontamentos, []);
});

test("rejeita mes vazio", async () => {
  await assert.rejects(
    () => new GerarEspelhoPontoBolsistaUseCase(baseRepository, {} as any)
      .execute("b1", "e1", undefined as any),
    (error: any) => error.statusCode === 400,
  );
});
