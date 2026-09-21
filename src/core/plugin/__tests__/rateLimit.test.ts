import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";

process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??= "mariadb://user:pass@localhost:3306/app_prefeitura_test";
process.env.SECRET_KEY ??= "12345678901234567890123456789012";
process.env.MAIL_ADRESS ??= "test@example.com";
process.env.MAIL_PASSWORD ??= "password";
process.env.MAIL_HOST ??= "localhost";
process.env.CORS_ORIGINS ??= "http://localhost:5173";
process.env.APPLICATION_PORT ??= "3000";

test("rate limit usa request.ip e ignora x-real-ip não confiável", async () => {
  const { rateLimitKey } = await import("../rateLimit.js");
  const request = {
    ip: "127.0.0.1",
    headers: { "x-real-ip": "203.0.113.10" },
  } as any;
  assert.equal(rateLimitKey(request), "127.0.0.1");
});

test("rate limit retorna 429 e Retry-After ao exceder limite da rota", async () => {
  const { default: rateLimit } = await import("../rateLimit.js");
  const app = Fastify({ trustProxy: false });
  await app.register(rateLimit);
  app.get("/limited", { config: { rateLimit: { max: 1, timeWindow: "1 minute" } } }, async () => ({ ok: true }));
  const first = await app.inject({ method: "GET", url: "/limited" });
  const second = await app.inject({ method: "GET", url: "/limited" });
  assert.equal(first.statusCode, 200);
  assert.equal(second.statusCode, 429);
  assert.ok(second.headers["retry-after"]);
  await app.close();
});

test("Fastify só aceita IP encaminhado por proxy explicitamente confiável", async () => {
  const direct = Fastify({ trustProxy: false });
  direct.get("/ip", async (request) => ({ ip: request.ip }));
  const directResponse = await direct.inject({
    method: "GET",
    url: "/ip",
    headers: { "x-forwarded-for": "203.0.113.10" },
  });
  assert.equal(directResponse.json().ip, "127.0.0.1");
  await direct.close();

  const proxied = Fastify({ trustProxy: ["127.0.0.1"] });
  proxied.get("/ip", async (request) => ({ ip: request.ip }));
  const proxiedResponse = await proxied.inject({
    method: "GET",
    url: "/ip",
    headers: { "x-forwarded-for": "203.0.113.10" },
  });
  assert.equal(proxiedResponse.json().ip, "203.0.113.10");
  await proxied.close();
});
