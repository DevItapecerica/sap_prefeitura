import assert from "node:assert/strict";
import test from "node:test";
import { ApplicationEventContext } from "../../../core/event/application-event.js";
import { User } from "../../../modules/user/domain/entity/User.js";
import { EventBusUserEventsAdapter } from "../event-bus-user-events.adapter.js";

test("EventBusUserEventsAdapter publishes and unsubscribes typed events", async () => {
  const adapter = new EventBusUserEventsAdapter();
  const received: string[] = [];
  const context: ApplicationEventContext = {
    correlationId: "request-1",
    actor: { id: 1 },
    origin: { type: "SYSTEM" },
  };
  const before = new User("Antes", "antes@itapecerica.sp.gov.br", null, 1, 1, 7);
  const after = new User("Depois", "depois@itapecerica.sp.gov.br", null, 2, 2, 7);
  const unsubscribe = [
    adapter.onCreated(() => { received.push("created"); }),
    adapter.onUpdated(() => { received.push("updated"); }),
    adapter.onDeleted(() => { received.push("deleted"); }),
    adapter.onPasswordChanged(() => { received.push("password"); }),
  ];

  try {
    await adapter.publishCreated({ context, user: after });
    await adapter.publishUpdated({ context, before, after });
    await adapter.publishDeleted({ context, before });
    await adapter.publishPasswordChanged({ context, userId: 7 });
    assert.deepEqual(received, ["created", "updated", "deleted", "password"]);
  } finally {
    unsubscribe.forEach((off) => off());
  }

  await adapter.publishCreated({ context, user: after });
  assert.equal(received.length, 4);
});
