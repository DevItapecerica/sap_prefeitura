import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import healthRoutes from "../health.js";

test("health não consulta dependências", async () => {
  let called = false;
  const app = Fastify();
  await app.register(healthRoutes, {
    checks: [{ name: "database", check: async () => { called = true; } }],
  });
  const response = await app.inject({ method: "GET", url: "/health" });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { status: "ok" });
  assert.equal(called, false);
  await app.close();
});

test("ready retorna 200 quando todas as dependências respondem", async () => {
  const app = Fastify();
  await app.register(healthRoutes, {
    checks: [
      { name: "database", check: async () => undefined },
      { name: "pdf", check: async () => undefined },
    ],
  });
  const response = await app.inject({ method: "GET", url: "/ready" });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { status: "ready" });
  await app.close();
});

test("ready retorna 503 sem revelar a dependência que falhou", async () => {
  const app = Fastify();
  await app.register(healthRoutes, {
    checks: [{ name: "database", check: async () => { throw new Error("secret host"); } }],
  });
  const response = await app.inject({ method: "GET", url: "/ready" });
  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.json(), { status: "not_ready" });
  assert.equal(response.body.includes("secret host"), false);
  await app.close();
});
