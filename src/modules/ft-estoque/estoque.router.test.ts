import { EstoqueController } from "./interface/controller/estoque.controller.js";
import test from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import AuthMiddleware from "../auth/auth.middleware.js";
import { EstoqueRouter } from "./estoque.router.js";

test("stock HTTP guards, immutable fields, strict payloads and delivery/reversal contracts", async () => {
  const saved = AuthMiddleware.verifyJWT;
  AuthMiddleware.verifyJWT = async (r: any) => {
    r.user = { id: 1 };
  };
  const app = Fastify(),
    grants = new Set<string>(),
    calls: string[] = [];
  app.decorate("permissionAuthorizer", {
    authorize: async (_id: number, _module: string, action: string) => {
      if (!grants.has(action))
        throw Object.assign(new Error("Denied"), { statusCode: 403 });
    },
  });
  const service: any = new Proxy(
    {},
    {
      get: (_target, method: string) => async () => {
        calls.push(method);
        return {
          id: "d96ceba9-8445-48b9-aa12-7312217d7ec1",
          rows: [],
          count: 0,
          saldo: 2,
          injected: "hidden",
        };
      },
    },
  );
  await app.register(EstoqueRouter, {
    controller: new EstoqueController(service),
  });
  const id = "d96ceba9-8445-48b9-aa12-7312217d7ec1",
    operacao_id = "a96ceba9-8445-48b9-aa12-7312217d7ec1";
  try {
    assert.equal((await app.inject("/itens")).statusCode, 403);
    grants.add("consultar_estoque");
    assert.equal((await app.inject("/itens")).statusCode, 200);
    grants.add("cadastrar_item_estoque");
    const complete = {
      operacao_id,
      nome: "Bota",
      epi: true,
      tamanhos: [{ tamanho: "38", custo_unitario: 10, quantidade_inicial: 1 }],
    };
    const beforeComplete = calls.length;
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/itens/cadastro-completo",
          payload: complete,
        })
      ).statusCode,
      403,
    );
    assert.equal(calls.length, beforeComplete);
    const zero = {
      ...complete,
      tamanhos: [{ tamanho: "38", custo_unitario: 10, quantidade_inicial: 0 }],
    };
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/itens/cadastro-completo",
          payload: zero,
        })
      ).statusCode,
      200,
    );
    grants.add("registrar_entrada_estoque");
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/itens/cadastro-completo",
          payload: complete,
        })
      ).statusCode,
      200,
    );
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/itens/cadastro-completo",
          payload: {
            ...complete,
            tamanhos: [{ ...complete.tamanhos[0], saldo: 10 }],
          },
        })
      ).statusCode,
      400,
    );
    for (const extra of [
      { saldo: 10 },
      { custo_centavos: 10 },
      { autor_id: "9" },
      { entregue_em: "2020-01-01" },
    ]) {
      assert.equal(
        (
          await app.inject({
            method: "POST",
            url: "/itens",
            payload: { operacao_id, nome: "Bota", epi: true, ...extra },
          })
        ).statusCode,
        400,
      );
    }
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/itens",
          payload: { operacao_id, nome: "Bota", epi: "true" },
        })
      ).statusCode,
      400,
    );
    const response = await app.inject({
      method: "POST",
      url: "/itens",
      payload: { operacao_id, nome: "Bota", epi: true },
    });
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().injected, undefined);
    grants.add("entregar_kit_epi");
    const delivery = {
      operacao_id,
      participacao_id: id,
      versao: "a".repeat(64),
      itens: [{ variacao_id: id, quantidade: 1 }],
    };
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/entregas/kit",
          payload: delivery,
        })
      ).statusCode,
      403,
    );
    grants.add("consultar_vinculos");
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/entregas/kit",
          payload: delivery,
        })
      ).statusCode,
      200,
    );
    grants.add("entregar_item_estoque");
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/entregas/individual",
          payload: delivery,
        })
      ).statusCode,
      400,
    );
    grants.add("estornar_entrega_estoque");
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/entregas/" + id + "/estornar",
          payload: { operacao_id },
        })
      ).statusCode,
      400,
    );
    assert.equal(
      (
        await app.inject({
          method: "PUT",
          url: "/entregas/" + id,
          payload: delivery,
        })
      ).statusCode,
      404,
    );
    assert.equal((await app.inject("/itens?limit=51")).statusCode, 400);
  } finally {
    await app.close();
    AuthMiddleware.verifyJWT = saved;
  }
});
