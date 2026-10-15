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
      findVinculo: async () => vinculo,
      createOcorrencia: async (data: any) => model({ id: "o1", ...data }),
      findAndCountOcorrenciasByBolsista: async () => ({ count: 1, rows: [ocorrencia] }),
      findOcorrenciaById: async () => ocorrencia,
      destroyOcorrencia: async () => { removed = true; },
    };
    const service = new FtBolsistaService(repository as any);
    const created = await service.createOcorrencia("b1", { edital_id: "e1", data_ocorrencia: "2026-10-15", descricao: "  Atendimento  " }, 7);
    assert.equal(created.ocorrencia.get("descricao"), "Atendimento");
    assert.equal((await service.listOcorrencias("b1")).count, 1);
    await service.deleteOcorrencia("b1", "o1");
    assert.equal(removed, true);
  });

  it("valida dados e data futura da ocorrencia", async () => {
    const service = new FtBolsistaService({} as any);
    await assert.rejects(() => service.createOcorrencia("b1", { edital_id: "e1", data_ocorrencia: "", descricao: "" }, 1), (error: any) => error.statusCode === 400);
    await assert.rejects(() => service.createOcorrencia("b1", { edital_id: "e1", data_ocorrencia: "2999-01-01", descricao: "Teste" }, 1), (error: any) => error.statusCode === 400);
  });
});
