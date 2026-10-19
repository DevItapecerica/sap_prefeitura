import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FtBolsistaService } from "../use-case/ft-bolsista.service.js";

const model = (data: any) => ({ get: (key: string) => data[key], toJSON: () => data });

describe("cadastro parte II no bolsista", () => {
  it("lista aniversariantes ativos do mes ordenados", async () => {
    const repository = {
      findAniversariantesAtivos: async () => [
        model({ id: "b2", municipe: { nome: "Zélia", nascimento: "1990-10-20" }, bolsistas_edital: [{ local: "CRAS", edital: { id: "e1", name: "Edital" }, turno: { nome: "Tarde" } }] }),
        model({ id: "b1", municipe: { nome: "Ana", nascimento: "1995-10-02" }, bolsistas_edital: [{ local: "Paço", edital: { id: "e1", name: "Edital" }, turno: null }] }),
        model({ id: "b3", municipe: { nome: "Outro mês", nascimento: "1995-09-02" }, bolsistas_edital: [] }),
      ],
    };
    const result = await new FtBolsistaService(repository as any).getAniversariantes(10);
    assert.equal(result.count, 2);
    assert.deepEqual(result.aniversariantes.map((item) => item.nome), ["Ana", "Zélia"]);
    await assert.rejects(() => new FtBolsistaService(repository as any).getAniversariantes(13), (error: any) => error.statusCode === 400);
  });

  it("cria, lista e remove ocorrencias pelo vinculo", async () => {
    let removed = false;
    const vinculo = model({ id: "v1", bolsista_id: "b1" });
    const ocorrencia = model({ id: "o1", vinculo });
    const repository = {
      findById: async () => model({ id: "b1" }),
      findVinculoById: async () => vinculo,
      createOcorrencia: async (data: any) => model({ id: "o1", ...data }),
      findAndCountOcorrenciasByBolsista: async () => ({ count: 1, rows: [ocorrencia] }),
      findOcorrenciaById: async () => ocorrencia,
      destroyOcorrencia: async () => { removed = true; },
    };
    const service = new FtBolsistaService(repository as any);
    const created = await service.createOcorrencia("b1", { bolsista_edital_id: "v1", data_ocorrencia: "2026-10-15", descricao: "  Atendimento  " }, 7);
    assert.equal(created.ocorrencia.get("descricao"), "Atendimento");
    assert.equal((await service.listOcorrencias("b1")).count, 1);
    await service.deleteOcorrencia("b1", "o1");
    assert.equal(removed, true);
  });

  it("valida dados e data futura da ocorrencia", async () => {
    const service = new FtBolsistaService({} as any);
    await assert.rejects(() => service.createOcorrencia("b1", { bolsista_edital_id: "v1", data_ocorrencia: "", descricao: "" }, 1), (error: any) => error.statusCode === 400);
    await assert.rejects(() => service.createOcorrencia("b1", { bolsista_edital_id: "v1", data_ocorrencia: "2999-01-01", descricao: "Teste" }, 1), (error: any) => error.statusCode === 400);
    await assert.rejects(() => service.createOcorrencia("b1", { bolsista_edital_id: "v1", data_ocorrencia: "2026-02-30", descricao: "Teste" }, 1), (error: any) => error.statusCode === 400);
    await assert.rejects(() => service.createOcorrencia("b1", { bolsista_edital_id: "v1", data_ocorrencia: "2026-10-15", descricao: "x".repeat(2001) }, 1), (error: any) => error.statusCode === 400);
  });

  it("rejeita vinculo pertencente a outro bolsista", async () => {
    const repository = {
      findById: async () => model({ id: "b1" }),
      findVinculoById: async () => model({ id: "v1", bolsista_id: "b2" }),
    };
    const service = new FtBolsistaService(repository as any);
    await assert.rejects(
      () => service.createOcorrencia("b1", { bolsista_edital_id: "v1", data_ocorrencia: "2026-10-15", descricao: "Teste" }, 1),
      (error: any) => error.statusCode === 404,
    );
  });

  it("filtra aniversarios invalidos e aceita objetos simples sem vinculo", async () => {
    const currentMonth = new Date().getMonth() + 1;
    const month = String(currentMonth).padStart(2, "0");
    const repository = {
      findAniversariantesAtivos: async () => [
        { id: "b2", municipe: { nome: "Bruna", nascimento: `1990-${month}-10` }, bolsistas_edital: [] },
        { id: "b1", municipe: { nome: "Ana", nascimento: `1995-${month}-10` } },
        { id: "b3", municipe: { nome: "Sem data", nascimento: null } },
      ],
    };

    const result = await new FtBolsistaService(repository as any).getAniversariantes();

    assert.equal(result.mes, currentMonth);
    assert.deepEqual(result.aniversariantes.map((item) => item.nome), ["Ana", "Bruna"]);
    assert.equal(result.aniversariantes[0].edital, null);
  });

  it("rejeita ocorrencia para bolsista ausente e remocao inexistente", async () => {
    const missingRepository = {
      findById: async () => null,
      findOcorrenciaById: async () => null,
    };
    const service = new FtBolsistaService(missingRepository as any);

    await assert.rejects(
      () => service.createOcorrencia("b1", { bolsista_edital_id: "v1", data_ocorrencia: "2026-10-15", descricao: "Teste" }, 1),
      (error: any) => error.statusCode === 404,
    );
    await assert.rejects(
      () => service.listOcorrencias("b1"),
      (error: any) => error.statusCode === 404,
    );
    await assert.rejects(
      () => service.deleteOcorrencia("b1", "o1"),
      (error: any) => error.statusCode === 404,
    );
  });
});
