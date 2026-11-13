import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import { requirePermission } from "../../acess-controll/interface/require-permission.js";
import { authorizeHoleriteFile, canReadHolerites } from "./holerite-access.js";

test("archive list, download and retry enforce the extra payroll permission without granting on unexpected errors", async () => {
  const app = Fastify();
  const grants = new Set<string>();
  let errorStatus = 403;
  app.decorate("permissionAuthorizer", {
    authorize: async (_id: number, _module: string, action: string) => {
      if (!grants.has(action))
        throw Object.assign(new Error("Denied"), { statusCode: errorStatus });
    },
  });
  app.addHook("preHandler", async (request) => {
    Object.assign(request, { user: { id: 1 } });
  });
  app.get(
    "/list",
    { preHandler: requirePermission("ft")("consultar_downloads") },
    async (request) => ({ includeHolerites: await canReadHolerites(request) }),
  );
  app.get<{ Params: { id: string } }>(
    "/:id/download",
    { preHandler: requirePermission("ft")("baixar_relatorio") },
    async (request) => {
      await authorizeHoleriteFile(request, {
        isHolerite: async (id) => id === "holerite",
      });
      return { ok: true };
    },
  );
  app.post<{ Params: { id: string } }>(
    "/:id/retry",
    { preHandler: requirePermission("ft")("reprocessar_relatorio") },
    async (request) => {
      await authorizeHoleriteFile(request, {
        isHolerite: async (id) => id === "holerite",
      });
      return { ok: true };
    },
  );
  try {
    grants.add("gerar_relatorio_edital");
    assert.equal((await app.inject("/list")).statusCode, 403);
    assert.equal((await app.inject("/holerite/download")).statusCode, 403);
    assert.equal(
      (await app.inject({ method: "POST", url: "/holerite/retry" })).statusCode,
      403,
    );
    grants.clear();
    for (const action of [
      "consultar_downloads",
      "baixar_relatorio",
      "reprocessar_relatorio",
    ])
      grants.add(action);
    assert.equal((await app.inject("/list")).json().includeHolerites, false);
    assert.equal((await app.inject("/holerite/download")).statusCode, 403);
    assert.equal(
      (await app.inject({ method: "POST", url: "/holerite/retry" })).statusCode,
      403,
    );
    assert.equal((await app.inject("/espelho/download")).statusCode, 200);
    assert.equal(
      (await app.inject({ method: "POST", url: "/espelho/retry" })).statusCode,
      200,
    );
    errorStatus = 500;
    assert.equal((await app.inject("/list")).statusCode, 500);
    grants.add("gerar_relatorio_edital");
    assert.equal((await app.inject("/list")).json().includeHolerites, true);
    assert.equal((await app.inject("/holerite/download")).statusCode, 200);
    assert.equal(
      (await app.inject({ method: "POST", url: "/holerite/retry" })).statusCode,
      200,
    );
  } finally {
    await app.close();
  }
});
