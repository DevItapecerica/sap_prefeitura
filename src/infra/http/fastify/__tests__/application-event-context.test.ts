import assert from "node:assert/strict";
import test from "node:test";
import { FastifyRequest } from "fastify";
import { makeApplicationEventContext } from "../application-event-context.js";

test("makeApplicationEventContext maps actor and HTTP origin", () => {
  const request = {
    id: "request-1",
    user: { id: 7, name: "Ana", role_id: 2, setor_id: 3 },
    ip: "127.0.0.1",
    method: "PUT",
    url: "/service/6?debug=true",
    routeOptions: { url: "/service/:id" },
  } as unknown as FastifyRequest;

  assert.deepEqual(makeApplicationEventContext(request), {
    correlationId: "request-1",
    actor: { id: 7, name: "Ana", roleId: 2, setorId: 3 },
    origin: {
      type: "HTTP",
      ip: "127.0.0.1",
      method: "PUT",
      route: "/service/:id",
    },
  });
});
