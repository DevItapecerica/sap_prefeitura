import assert from "node:assert/strict";
import test from "node:test";
import { ApplicationEventContext } from "../../../core/event/application-event.js";
import { Services } from "../../../modules/services/domain/entity/Services.js";
import { EventBusServiceEventsAdapter } from "../event-bus-service-events.adapter.js";

test("EventBusServiceEventsAdapter publishes and unsubscribes typed events", async () => {
  const adapter = new EventBusServiceEventsAdapter();
  const received: string[] = [];
  const context: ApplicationEventContext = {
    correlationId: "request-1",
    actor: { id: 1 },
    origin: { type: "SYSTEM" },
  };
  const service = new Services(6, "FT", "FT", "ft", "/ft", new Date(), new Date(), null);
  const aggregate = { services: service, permissions: [], visibility: [] };
  const unsubscribe = [
    adapter.onCreated(() => { received.push("created"); }),
    adapter.onUpdated(() => { received.push("updated"); }),
    adapter.onDeleted(() => { received.push("deleted"); }),
  ];

  try {
    await adapter.publishCreated({ context, service });
    await adapter.publishUpdated({ context, before: aggregate, after: aggregate });
    await adapter.publishDeleted({ context, before: aggregate });
    assert.deepEqual(received, ["created", "updated", "deleted"]);
  } finally {
    unsubscribe.forEach((off) => off());
  }

  await adapter.publishCreated({ context, service });
  assert.equal(received.length, 3);
});
