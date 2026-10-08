import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import requestIdHeader, { getRequestId } from "../requestId.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const buildApp = async () => {
  const app = Fastify({ genReqId: getRequestId });
  await app.register(requestIdHeader);
  app.get("/request-id", async (request) => ({ requestId: request.id }));
  return app;
};

test("preserva X-Request-Id UUID valido na requisicao, resposta e contexto", async (context) => {
  const app = await buildApp();
  context.after(() => app.close());
  const requestId = "01994a8c-41c2-7e35-9a3b-9fb9cf158423";
  const response = await app.inject({
    method: "GET",
    url: "/request-id",
    headers: { "x-request-id": requestId.toUpperCase() },
  });

  assert.equal(response.headers["x-request-id"], requestId);
  assert.equal(response.json().requestId, requestId);
});

for (const input of [undefined, "req-1", "invalid value", "a".repeat(121)]) {
  test(`gera UUID seguro quando X-Request-Id e ${input === undefined ? "ausente" : "invalido"}`, async (context) => {
    const app = await buildApp();
    context.after(() => app.close());
    const response = await app.inject({
      method: "GET",
      url: "/request-id",
      headers: input === undefined ? {} : { "x-request-id": input },
    });

    const requestId = response.headers["x-request-id"];
    assert.match(String(requestId), UUID_PATTERN);
    assert.equal(response.json().requestId, requestId);
    assert.notEqual(requestId, input);
  });
}
