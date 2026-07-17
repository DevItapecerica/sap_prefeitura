import assert from "node:assert/strict";
import test from "node:test";
import { ApplicationEventContext } from "../../../../../core/event/application-event.js";
import { User } from "../../../domain/entity/User.js";
import {
  userEventPublisher,
  userEventSubscriptions,
} from "../user.events.js";

test("typed user event facade publishes and unsubscribes all user events", async () => {
  const received: string[] = [];
  const context: ApplicationEventContext = {
    correlationId: "request-1",
    actor: { id: 1 },
    origin: { type: "SYSTEM" },
  };
  const before = new User("Antes", "antes@itapecerica.sp.gov.br", null, 1, 1, 7);
  const after = new User("Depois", "depois@itapecerica.sp.gov.br", null, 2, 2, 7);
  const unsubscribe = [
    userEventSubscriptions.onCreated(() => { received.push("created"); }),
    userEventSubscriptions.onUpdated(() => { received.push("updated"); }),
    userEventSubscriptions.onDeleted(() => { received.push("deleted"); }),
    userEventSubscriptions.onPasswordChanged(() => { received.push("password"); }),
  ];

  try {
    await userEventPublisher.publishCreated({ context, user: after });
    await userEventPublisher.publishUpdated({ context, before, after });
    await userEventPublisher.publishDeleted({ context, before });
    await userEventPublisher.publishPasswordChanged({ context, userId: 7 });
    assert.deepEqual(received, ["created", "updated", "deleted", "password"]);
  } finally {
    unsubscribe.forEach((off) => off());
  }

  await userEventPublisher.publishCreated({ context, user: after });
  assert.equal(received.length, 4);
});
