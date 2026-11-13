import assert from "node:assert/strict";
import test from "node:test";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { FtRelatorioRouter } from "./ft-relatorio.router.js";
import type { FtRelatorioController } from "../controller/ft-relatorio.controller.js";

test("holerite HTTP requires report permission, typed month and rejects extra or coerced body fields", async () => {
  const original = AuthMiddleware.verifyJWT;
  AuthMiddleware.verifyJWT = async (request) => {
    Object.assign(request, { user: { id: 123 } });
  };
  const app = Fastify();
  let allowed = false,
    called = 0;
  app.decorate("permissionAuthorizer", {
    authorize: async (_id: number, _module: string, action: string) => {
      assert.equal(action, "gerar_relatorio_edital");
      if (!allowed)
        throw Object.assign(new Error("Denied"), { statusCode: 403 });
    },
  });
  const handler = async (_request: FastifyRequest, reply: FastifyReply) => {
    called++;
    return reply.status(202).send({
      arquivo: {
        id: "3739d774-6de0-4f48-8dda-1b43414b70ef",
        tipo: "holerites",
      },
    });
  };
  const controller = new Proxy({} as typeof FtRelatorioController, {
    get: () => handler,
  });
  await app.register(FtRelatorioRouter, { prefix: "/relatorio", controller });
  const url =
    "/relatorio/edital/3739d774-6de0-4f48-8dda-1b43414b70ef/holerites";
  try {
    assert.equal(
      (await app.inject({ method: "POST", url, payload: { mes: "2026-11" } }))
        .statusCode,
      403,
    );
    assert.equal(
      (
        await app.inject(
          `${url}/3739d774-6de0-4f48-8dda-1b43414b70ef?mes=2026-11`,
        )
      ).statusCode,
      403,
    );
    allowed = true;
    for (const payload of [
      { mes: "2026-11", valor: 900 },
      { mes: 202611 },
      { mes: "2026-13" },
      {},
    ])
      assert.equal(
        (await app.inject({ method: "POST", url, payload })).statusCode,
        400,
      );
    assert.equal(called, 0);
    const response = await app.inject({
      method: "POST",
      url,
      payload: { mes: "2026-11" },
    });
    assert.equal(response.statusCode, 202);
    assert.equal(response.json().arquivo.tipo, "holerites");
    assert.equal(
      (await app.inject(`${url}/3739d774-6de0-4f48-8dda-1b43414b70ef`))
        .statusCode,
      400,
    );
    assert.equal(
      (
        await app.inject(
          `${url}/3739d774-6de0-4f48-8dda-1b43414b70ef?mes=2026-11`,
        )
      ).statusCode,
      202,
    );
  } finally {
    AuthMiddleware.verifyJWT = original;
    await app.close();
  }
});
