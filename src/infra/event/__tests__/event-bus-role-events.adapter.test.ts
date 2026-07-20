import assert from "node:assert/strict";
import test from "node:test";
import { Roles } from "../../../modules/roles/domain/entity/Role.js";
import { EventBusRoleEventsAdapter } from "../event-bus-role-events.adapter.js";

test("EventBusRoleEventsAdapter publishes and unsubscribes typed events", async () => {
  const adapter = new EventBusRoleEventsAdapter();
  const received: string[] = [];
  const context = { correlationId: "request-1", origin: { type: "SYSTEM" as const } };
  const before = new Roles(2, "Gestor");
  const after = new Roles(2, "Operador");
  const aggregate = { role: before, permissions: [] };
  const unsubscribe = [
    adapter.onCreated(() => { received.push("created"); }),
    adapter.onUpdated(() => { received.push("updated"); }),
    adapter.onDeleted(() => { received.push("deleted"); }),
  ];
  await adapter.publishCreated({ context, role: before });
  await adapter.publishUpdated({ context, before, after });
  await adapter.publishDeleted({ context, before: aggregate });
  assert.deepEqual(received, ["created", "updated", "deleted"]);
  unsubscribe.forEach((off) => off());
  await adapter.publishCreated({ context, role: before });
  assert.equal(received.length, 3);
});
