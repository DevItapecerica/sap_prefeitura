import assert from "node:assert/strict";
import test from "node:test";
import { GerarFolhaPresencaBolsistaUseCase } from "../use-case/gerar-folha-presenca-bolsista.use-case.js";

test("gera folha vazia usando o unico vinculo vigente no mes", async () => {
  let payload: any;
  const repository = {
    findById: async () => ({ id: "b1", municipe: { nome: "Maria", rua: "Rua A", numero: "10", bairro: "Centro", cidade: "Itapecerica", uf: "SP" } }),
    findEditalById: async () => ({ id: "e1", name: "Edital 1" }),
    findHistoricoByBolsistaId: async () => [
      { edital_id: "e1", data_vinculo: "2026-01-01", concluded_at: "2026-01-31", local: "Antigo" },
      { edital_id: "e1", data_vinculo: "2026-02-15", expire_at: "2026-12-31", local: "Atual" },
      { edital_id: "outro", data_vinculo: "2026-03-01", expire_at: "2026-12-31", local: "Ignorado" },
    ],
  };
  const pdf = { execute: async (data: any) => { payload = data; return { file: Buffer.from("%PDF") }; } };

  await new GerarFolhaPresencaBolsistaUseCase(repository as any, pdf as any)
    .execute("b1", "e1", "2026-06");

  assert.equal(payload.servidor.unidade, "Atual");
  assert.equal(payload.servidor.localTrabalho, "Atual");
  assert.equal(payload.dias.length, 30);
  assert.deepEqual(payload.dias[0], { data: "2026-06-01", situacao: "Normal" });
  assert.deepEqual(payload.dias[5], { data: "2026-06-06", situacao: "Folga" });
  assert.deepEqual(payload.dias[6], { data: "2026-06-07", situacao: "DSR" });
  assert.deepEqual(payload.dias[29], { data: "2026-06-30", situacao: "Normal" });
  assert.match(payload.servidor.endereco, /Rua A/);
  assert.equal(payload.observacoes, "");
});

test("rejeita quando nenhum vinculo abrange o mes", async () => {
  const repository = {
    findById: async () => ({ id: "b1", municipe: { nome: "Maria" } }),
    findEditalById: async () => ({ id: "e1", name: "Edital 1" }),
    findHistoricoByBolsistaId: async () => [
      { edital_id: "e1", data_vinculo: "2025-01-01", expired_at: "2025-12-31" },
    ],
  };
  await assert.rejects(
    () => new GerarFolhaPresencaBolsistaUseCase(repository as any, { execute: async () => ({}) } as any).execute("b1", "e1", "2026-06"),
    (error: any) => error.statusCode === 409,
  );
});

test("valida mes, bolsista e edital antes de renderizar", async () => {
  const missingBolsista = {
    findById: async () => null,
  };
  await assert.rejects(
    () => new GerarFolhaPresencaBolsistaUseCase(missingBolsista as any, {} as any).execute("b1", "e1", "invalido"),
    (error: any) => error.statusCode === 400,
  );
  await assert.rejects(
    () => new GerarFolhaPresencaBolsistaUseCase(missingBolsista as any, {} as any).execute("b1", "e1", "2026-06"),
    (error: any) => error.statusCode === 404,
  );

  const missingEdital = {
    findById: async () => ({ id: "b1", municipe: {} }),
    findEditalById: async () => null,
  };
  await assert.rejects(
    () => new GerarFolhaPresencaBolsistaUseCase(missingEdital as any, {} as any).execute("b1", "e1", "2026-06"),
    (error: any) => error.statusCode === 404,
  );
});

test("mantem campos opcionais vazios quando o cadastro nao os possui", async () => {
  let payload: any;
  const repository = {
    findById: async () => ({ municipe: {} }),
    findEditalById: async () => ({ id: "e1" }),
    findHistoricoByBolsistaId: async () => [{ edital_id: "e1", data_vinculo: new Date("2026-06-01T00:00:00.000Z") }],
  };
  const pdf = { execute: async (data: any) => { payload = data; return { file: Buffer.from("%PDF") }; } };

  await new GerarFolhaPresencaBolsistaUseCase(repository as any, pdf as any)
    .execute("b1", "e1", "2026-06");

  assert.equal(payload.servidor.nome, "");
  assert.equal(payload.servidor.localTrabalho, "");
  assert.equal(payload.servidor.endereco, "");
  assert.match(payload.name, /b1/);
});

test("marca como fora do vinculo as datas anteriores e posteriores ao periodo", async () => {
  let payload: any;
  const repository = {
    findById: async () => ({ id: "b1", municipe: { nome: "Maria" } }),
    findEditalById: async () => ({ id: "e1" }),
    findHistoricoByBolsistaId: async () => [{
      edital_id: "e1",
      data_vinculo: "2026-06-10",
      canceled_at: "2026-06-20",
    }],
  };
  const pdf = { execute: async (data: any) => { payload = data; return { file: Buffer.from("%PDF") }; } };

  await new GerarFolhaPresencaBolsistaUseCase(repository as any, pdf as any)
    .execute("b1", "e1", "2026-06");

  assert.equal(payload.dias[0].situacao, "Fora do vínculo");
  assert.equal(payload.dias[9].situacao, "Normal");
  assert.equal(payload.dias[20].situacao, "Fora do vínculo");
});
