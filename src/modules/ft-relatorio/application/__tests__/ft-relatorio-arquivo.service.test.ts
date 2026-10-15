import assert from "node:assert/strict";
import test from "node:test";
import { FtRelatorioArquivoService } from "../use-case/ft-relatorio-arquivo.service.js";
import { FtRelatorioPeriodoService } from "../../domain/services/ft-relatorio-periodo.service.js";

const makeService = (hasEdital = true) => {
  let created: any;
  const files = {
    async create(data: any) {
      created = { ...data, createdAt: new Date("2026-10-15T12:00:00.000Z") };
      return created;
    },
    async list(page: number, limit: number) {
      return {
        rows: [{
          id: "arquivo-1",
          nome_arquivo: "folhas.zip",
          tipo: "folhas_presenca",
          status: "concluido",
          edital_id: "edital-1",
          mes: "2026-09",
          solicitado_por: 12,
          caminho_arquivo: "nao-expor.zip",
          total_bolsistas: 1,
          total_gerados: 1,
          total_falhas: 0,
          tentativas: 0,
        }],
        count: page + limit,
      };
    },
  };
  const reports = {
    async findEditalById() {
      return hasEdital ? { id: "edital-1", name: "Edital São José" } : null;
    },
  };
  const period = new FtRelatorioPeriodoService(() => new Date("2026-10-15T12:00:00.000Z"));
  return {
    service: new FtRelatorioArquivoService(files as any, reports as any, period),
    created: () => created,
  };
};

test("solicita lote de folhas de presenca com tipo e nome especificos", async () => {
  const fixture = makeService();
  const result = await fixture.service.request("edital-1", "2026-09", 12, "folhas_presenca");

  assert.equal(result.tipo, "folhas_presenca");
  assert.equal(result.nome_arquivo, "folhas-presenca-Edital-Sao-Jose-2026-09.zip");
  assert.equal(fixture.created().tipo, "folhas_presenca");
  assert.equal(fixture.created().solicitado_por, 12);
});

test("mantem espelhos de ponto como tipo padrao", async () => {
  const fixture = makeService();
  const result = await fixture.service.request("edital-1", "2026-09", 12);

  assert.equal(result.tipo, "espelhos_ponto");
  assert.match(result.nome_arquivo, /^espelhos-ponto-/);
});

test("rejeita mes futuro e edital inexistente", async () => {
  await assert.rejects(
    () => makeService().service.request("edital-1", "2026-11", 12, "folhas_presenca"),
    /mes futuro/,
  );
  await assert.rejects(
    () => makeService(false).service.request("edital-1", "2026-09", 12, "folhas_presenca"),
    /Edital not found/,
  );
});

test("lista lotes com paginacao normalizada sem expor caminho interno", async () => {
  const result = await makeService().service.list(-2, 500);

  assert.equal(result.page, 0);
  assert.equal(result.limit, 100);
  assert.equal(result.count, 100);
  assert.equal(result.arquivos[0]?.tipo, "folhas_presenca");
  assert.equal("caminho_arquivo" in result.arquivos[0]!, false);
});
