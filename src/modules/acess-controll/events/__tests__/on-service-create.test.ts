import assert from "node:assert/strict";
import test from "node:test";
import { ServiceEventHandler, ServiceEventSubscriber } from "../../../services/application/events/service-event-bus.js";
import { ServiceCreatedEvent } from "../../../services/application/events/service.events.js";
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
    { error: () => undefined } as any,
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

test("service created handler contains access default failures", async () => {
  const events = new FakeSubscriber();
  const errors: unknown[] = [];
  registerServiceCreatedHandler(
    events,
    { ensureForService: async () => { throw new Error("offline"); } } as any,
    { error: (input: unknown) => { errors.push(input); } } as any,
  );

  await assert.doesNotReject(async () => events.created!({
    context: { correlationId: "request-2", origin: { type: "HTTP" } },
    service: new Services(12, "Novo", "Novo", "outros", "/novo", new Date(), new Date(), null),
  }));
  assert.equal(errors.length, 1);
});
