import assert from "node:assert/strict";
import test from "node:test";
import { SetorEventHandler, SetorEventSubscriber } from "../../../setor/application/events/setor-event-bus.js";
import { SetorCreatedEvent } from "../../../setor/application/events/setor.events.js";
import { Setor } from "../../../setor/domain/entity/Setor.js";
import { registerSetorCreatedHandler } from "../on-setor-create.js";

class FakeSubscriber implements SetorEventSubscriber {
  created?: SetorEventHandler<SetorCreatedEvent>;
  onCreated(handler: SetorEventHandler<SetorCreatedEvent>) {
    this.created = handler;
    return () => { if (this.created === handler) this.created = undefined; };
  }
  onUpdated() { return () => {}; }
  onDeleted() { return () => {}; }
}

test("setor created handler creates access defaults and unsubscribes", async () => {
  const events = new FakeSubscriber();
  const received: Setor[] = [];
  const unsubscribe = registerSetorCreatedHandler(
    events,
    { ensureForSetor: async (setor: Setor) => { received.push(setor); } } as any,
    { error: () => undefined } as any,
  );
  const setor = new Setor(2, "TI", "Tecnologia");

  await events.created?.({
    context: { correlationId: "request-1", origin: { type: "HTTP" } },
    setor,
  });
  assert.deepEqual(received, [setor]);

  unsubscribe();
  assert.equal(events.created, undefined);
});

test("setor created handler contains access default failures", async () => {
  const events = new FakeSubscriber();
  const errors: unknown[] = [];
  registerSetorCreatedHandler(
    events,
    { ensureForSetor: async () => { throw new Error("offline"); } } as any,
    { error: (input: unknown) => { errors.push(input); } } as any,
  );

  await assert.doesNotReject(async () => events.created!({
    context: { correlationId: "request-2", origin: { type: "HTTP" } },
    setor: new Setor(2, "TI", "Tecnologia"),
  }));
  assert.equal(errors.length, 1);
});
