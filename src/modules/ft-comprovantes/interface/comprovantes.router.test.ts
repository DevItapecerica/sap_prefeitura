import test from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import AuthMiddleware from "../../auth/auth.middleware.js";
import { ComprovantesRouter } from "./comprovantes.router.js";
import { ComprovantesController } from "./comprovantes.controller.js";

test("receipts enforce independent read permissions and forward scope without delivery permissions", async () => {
  const original = AuthMiddleware.verifyJWT;
  AuthMiddleware.verifyJWT = async (r) => {
    r.user = { id: 1 } as typeof r.user;
  };
  const app = Fastify();
  const id = "6c0bff59-e7da-4fbd-b324-72eb8ed303da";
  let denied = "",
    rendered = 0;
  const actions: string[] = [];
  app.decorate("permissionAuthorizer", {
    authorize: async (_id: number, _module: string, action: string) => {
      actions.push(action);
      if (denied === action)
        throw Object.assign(new Error("Denied"), { statusCode: 403 });
    },
  });
  const file = {
    file: Buffer.from("%PDF-test"),
    contentType: "application/pdf",
    contentDisposition: "attachment; filename=receipt.pdf",
  };
  const controller = new ComprovantesController({
    material: async (actual) => {
      assert.equal(actual, id);
      rendered++;
      return file;
    },
    benefit: async (edital, actual) => {
      assert.equal(edital, id);
      assert.equal(actual, id);
      rendered++;
      return file;
    },
  });
  await app.register(ComprovantesRouter, { controller });
  try {
    const stock = `/estoque/entregas/${id}/comprovante`;
    const benefit = `/edital/${id}/beneficios/entregas/${id}/comprovante`;
    for (const path of [stock, benefit]) {
      const response = await app.inject(path);
      assert.equal(response.statusCode, 200);
      assert.match(
        String(response.headers["content-type"]),
        /application\/pdf/,
      );
      assert.equal(response.headers["cache-control"], "no-store");
      assert.equal(response.payload, "%PDF-test");
    }
    for (const action of [
      "consultar_entregas_estoque",
      "consultar_edital",
      "consultar_vinculos",
      "consultar_entregas_beneficios",
    ]) {
      denied = action;
      assert.equal(
        (
          await app.inject(
            action === "consultar_entregas_estoque" ? stock : benefit,
          )
        ).statusCode,
        403,
      );
    }
    assert.equal(rendered, 2);
    assert.ok(
      !actions.some(
        (action) =>
          action.startsWith("entregar_") || action.startsWith("estornar_"),
      ),
    );
    assert.equal(
      (await app.inject("/estoque/entregas/invalid/comprovante")).statusCode,
      400,
    );
    AuthMiddleware.verifyJWT = async () => {
      throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
    };
    // Registered hook retains its original function; use a new app for unauthenticated validation.
    const anonymous = Fastify();
    await anonymous.register(ComprovantesRouter, { controller });
    assert.equal((await anonymous.inject(stock)).statusCode, 401);
    await anonymous.close();
  } finally {
    AuthMiddleware.verifyJWT = original;
    await app.close();
  }
});
