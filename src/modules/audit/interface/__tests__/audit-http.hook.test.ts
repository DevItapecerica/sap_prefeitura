import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import { RecordAuditDto } from "../../application/dto/audit.dto.js";
import { markAuditRequestHandled } from "../../events/audit-request-registry.js";
import { makeUserEventPublisher } from "../../../user/factories/user-events.factory.js";
import { User } from "../../../user/domain/entity/User.js";
import { makeAuditHttpHook } from "../audit-http.hook.js";

const userEventPublisher = makeUserEventPublisher();

test("HTTP hook does not duplicate a successful request already handled by an event", async () => {
  const records: RecordAuditDto[] = [];
  const app = Fastify({ logger: false });
  await app.register(makeAuditHttpHook({
    record: async (input) => records.push(input),
  }));
  app.put("/user/:id", async (request) => {
    request.user = {
      id: 1,
      name: "Admin",
      role_id: 1,
      setor_id: 1,
    };
    markAuditRequestHandled(request.id);
    return { user: { id: 7 }, ok: true };
  });

  const response = await app.inject({ method: "PUT", url: "/user/7" });
  assert.equal(response.statusCode, 200);
  assert.equal(records.length, 0);
  await app.close();
});

test("HTTP hook keeps the generic fallback when no event handles the request", async () => {
  const records: RecordAuditDto[] = [];
  const app = Fastify({ logger: false });
  await app.register(makeAuditHttpHook({
    record: async (input) => records.push(input),
  }));
  app.put("/user/:id", async (request) => {
    request.user = {
      id: 1,
      name: "Admin",
      role_id: 1,
      setor_id: 1,
    };
    const before = new User("Antes", "antes@itapecerica.sp.gov.br", null, 1, 1, 7);
    const after = new User("Depois", "depois@itapecerica.sp.gov.br", null, 2, 2, 7);
    await userEventPublisher.publishUpdated({
      context: {
        correlationId: request.id,
        actor: { id: request.user.id },
        origin: { type: "HTTP", method: request.method, route: "/user/:id" },
      },
      before,
      after,
    });
    return { user: { id: 7 }, ok: true };
  });

  const response = await app.inject({ method: "PUT", url: "/user/7" });
  assert.equal(response.statusCode, 200);
  assert.equal(records.length, 1);
  assert.equal(records[0]?.action, "UPDATE");
  await app.close();
});
