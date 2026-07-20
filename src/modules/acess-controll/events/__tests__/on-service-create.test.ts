import assert from "node:assert/strict";
import test from "node:test";
import { ServiceCreatedEvent } from "../../../services/application/events/service-created.event.js";
import { ServiceEventHandler } from "../../../services/application/events/service-event-handler.js";
import { ServiceEventSubscriber } from "../../../services/application/events/service-event-subscriber.js";
import { Services } from "../../../services/domain/entity/Services.js";
import { registerServiceCreatedHandler } from "../on-service-create.js";

class FakeSubscriber implements ServiceEventSubscriber {
  created?: ServiceEventHandler<ServiceCreatedEvent>;
  onCreated(handler: ServiceEventHandler<ServiceCreatedEvent>) {
    this.created = handler;
    return () => { if (this.created === handler) this.created = undefined; };
  }
  onUpdated() { return () => {}; }
  onDeleted() { return () => {}; }
}

test("service created handler creates access defaults and unsubscribes", async () => {
  const events = new FakeSubscriber();
  const received: number[] = [];
  const unsubscribe = registerServiceCreatedHandler(
    events,
    { ensureForService: async (id: number) => { received.push(id); } } as any,
  );
  const service = new Services(12, "Novo", "Novo", "outros", "/novo", new Date(), new Date(), null);

  await events.created?.({
    context: { correlationId: "request-1", origin: { type: "HTTP" } },
    service,
  });
  assert.deepEqual(received, [12]);

  unsubscribe();
  assert.equal(events.created, undefined);
});
