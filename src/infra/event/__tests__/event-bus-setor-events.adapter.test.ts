import assert from "node:assert/strict";
import test from "node:test";
import { ApplicationEventContext } from "../../../core/event/application-event.js";
import { Setor } from "../../../modules/setor/domain/entity/Setor.js";
import { EventBusSetorEventsAdapter } from "../event-bus-setor-events.adapter.js";

test("EventBusSetorEventsAdapter publishes and unsubscribes typed events", async () => {
  const adapter = new EventBusSetorEventsAdapter();
  const received: string[] = [];
  const context: ApplicationEventContext = {
    correlationId: "request-1",
    actor: { id: 1 },
    origin: { type: "SYSTEM" },
  };
  const before = new Setor(2, "TI", "Tecnologia");
  const after = new Setor(2, "Tecnologia", "Tecnologia atualizada");
  const unsubscribe = [
    adapter.onCreated(() => { received.push("created"); }),
    adapter.onUpdated(() => { received.push("updated"); }),
    adapter.onDeleted(() => { received.push("deleted"); }),
  ];

  try {
    await adapter.publishCreated({ context, setor: after });
    await adapter.publishUpdated({ context, before, after });
    await adapter.publishDeleted({ context, before });
    assert.deepEqual(received, ["created", "updated", "deleted"]);
  } finally {
    unsubscribe.forEach((off) => off());
  }

  await adapter.publishCreated({ context, setor: after });
  assert.equal(received.length, 3);
});
