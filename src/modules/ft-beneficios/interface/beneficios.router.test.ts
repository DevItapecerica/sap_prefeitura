import test from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import AuthMiddleware from "../../auth/auth.middleware.js";
import { BeneficiosRouter } from "./beneficios.router.js";
import { BeneficiosController } from "./beneficios.controller.js";
const id = "6c0bff59-e7da-4fbd-b324-72eb8ed303da";
test("benefit HTTP guards, strict bodies and independent read/report/write permissions", async () => {
  const original = AuthMiddleware.verifyJWT;
  AuthMiddleware.verifyJWT = async (r) => {
    r.user = { id: 1 } as typeof r.user;
  };
  const app = Fastify();
  const actions: string[] = [];
  let forbidden = "";
  app.decorate("permissionAuthorizer", {
    authorize: async (_id: number, _module: string, action: string) => {
      actions.push(action);
      if (action === forbidden)
        throw Object.assign(new Error("Denied"), { statusCode: 403 });
    },
  });
  const service = {
    preview: async () => ({
      mes: "2026-11",
      pessoa: { id, nome: "Pessoa", cpf: "00100200304" },
      participacao_id: id,
      permitir_encerrados: false,
      impedimento: null,
      beneficios: [],
    }),
    deliver: async () => {
      throw Object.assign(new Error("Reached service"), { statusCode: 409 });
    },
    reverse: async () => {
      throw Object.assign(new Error("Reached reverse"), { statusCode: 409 });
    },
    history: async () => ({ rows: [], count: 0 }),
    report: async () => ({
      rows: [],
      count: 0,
      mes: "2026-11",
      totais: { previstos: 0, retirados: 0, pendentes: 0 },
      beneficios: [],
    }),
    csv: async () => "Nome;CPF\r\nPessoa;00100200304",
  };
  await app.register(BeneficiosRouter, {
    prefix: "/edital",
    controller: new BeneficiosController({
      preview: { execute: service.preview },
      deliver: { execute: service.deliver },
      history: { execute: service.history },
      reverse: { execute: service.reverse },
      report: { execute: service.report },
      csv: { execute: service.csv },
    }),
  });
  try {
    assert.equal(
      (await app.inject(`/edital/${id}/participacoes/${id}/beneficios`))
        .statusCode,
      200,
    );
    assert.ok(actions.includes("consultar_vinculos"));
    forbidden = "entregar_beneficios";
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: `/edital/${id}/participacoes/${id}/beneficios/entregas`,
          payload: { operacao_id: id, beneficio_ids: [id] },
        })
      ).statusCode,
      403,
    );
    forbidden = "";
    for (const extra of [
      { mes: "2026-10" },
      { autor_id: 1 },
      { entregue_em: "2026-11-01" },
    ])
      assert.equal(
        (
          await app.inject({
            method: "POST",
            url: `/edital/${id}/participacoes/${id}/beneficios/entregas`,
            payload: { operacao_id: id, beneficio_ids: [id], ...extra },
          })
        ).statusCode,
        400,
      );
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: `/edital/${id}/participacoes/${id}/beneficios/entregas`,
          payload: { operacao_id: id, beneficio_ids: 1 },
        })
      ).statusCode,
      400,
    );
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: `/edital/${id}/participacoes/${id}/beneficios/entregas`,
          payload: { operacao_id: id, beneficio_ids: [id] },
        })
      ).statusCode,
      409,
    );
    forbidden = "gerar_relatorio_beneficios";
    assert.equal(
      (await app.inject(`/edital/${id}/beneficios/relatorio?mes=2026-11`))
        .statusCode,
      403,
    );
    forbidden = "";
    assert.equal(
      (
        await app.inject(
          `/edital/${id}/beneficios/entregas?participacao_id=${id}`,
        )
      ).statusCode,
      200,
    );
    assert.equal(
      (await app.inject(`/edital/${id}/beneficios/relatorio`)).statusCode,
      200,
    );
    const csv = await app.inject(
      `/edital/${id}/beneficios/relatorio.csv?mes=2026-11`,
    );
    assert.equal(csv.statusCode, 200);
    assert.match(csv.headers["content-type"]!, /text\/csv/);
    assert.match(csv.body, /00100200304/);
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: `/edital/${id}/beneficios/entregas/${id}/estornar`,
          payload: { operacao_id: id, motivo: "Erro" },
        })
      ).statusCode,
      409,
    );
  } finally {
    AuthMiddleware.verifyJWT = original;
    await app.close();
  }
});
