import assert from "node:assert/strict";
import test from "node:test";
import { ApplicationEventContext } from "../../../../core/event/application-event.js";
import { SetorCreatedEvent } from "../../../setor/application/events/setor-created.event.js";
import { SetorDeletedEvent } from "../../../setor/application/events/setor-deleted.event.js";
import { SetorEventHandler } from "../../../setor/application/events/setor-event-handler.js";
import { SetorEventSubscriber } from "../../../setor/application/events/setor-event-subscriber.js";
import { SetorUpdatedEvent } from "../../../setor/application/events/setor-updated.event.js";
import { Setor } from "../../../setor/domain/entity/Setor.js";
import { RecordAuditDto } from "../../application/dto/audit.dto.js";
import { consumeAuditRequestHandled } from "../audit-request-registry.js";
import { registerSetorAuditHandlers } from "../on-setor-events.js";

class FakeSetorEventSubscriber implements SetorEventSubscriber {
  created?: SetorEventHandler<SetorCreatedEvent>;
  updated?: SetorEventHandler<SetorUpdatedEvent>;
  deleted?: SetorEventHandler<SetorDeletedEvent>;

  onCreated(handler: SetorEventHandler<SetorCreatedEvent>) {
    this.created = handler;
    return () => { if (this.created === handler) this.created = undefined; };
  }
  onUpdated(handler: SetorEventHandler<SetorUpdatedEvent>) {
    this.updated = handler;
    return () => { if (this.updated === handler) this.updated = undefined; };
  }
  onDeleted(handler: SetorEventHandler<SetorDeletedEvent>) {
    this.deleted = handler;
    return () => { if (this.deleted === handler) this.deleted = undefined; };
  }
}

const context = (correlationId: string): ApplicationEventContext => ({
  correlationId,
  actor: { id: 9, name: "Admin", roleId: 1, setorId: 1 },
  origin: {
    type: "HTTP",
    ip: "127.0.0.1",
    method: "PUT",
    route: "/setores/:id",
  },
});

test("setor events create audit records with before and after", async () => {
  const events = new FakeSetorEventSubscriber();
  const records: RecordAuditDto[] = [];
  const unregister = registerSetorAuditHandlers(
    events,
    { record: async (input) => records.push(input) },
    { error() {} } as any,
  );
  const before = new Setor(2, "TI", "Tecnologia");
  const after = new Setor(2, "Tecnologia", "Atualizado");

  try {
    await events.created?.({ context: context("create-setor"), setor: after });
    await events.updated?.({ context: context("update-setor"), before, after });
    await events.deleted?.({ context: context("delete-setor"), before: after });

    assert.deepEqual(records.map((record) => record.action), [
      "CREATE",
      "UPDATE",
      "DELETE",
    ]);
    assert.equal(records[0].before, null);
    assert.equal(records[0].after, after);
    assert.equal(records[1].before, before);
    assert.equal(records[1].after, after);
    assert.equal(records[2].before, after);
    assert.equal(records[2].after, null);
    assert.equal(consumeAuditRequestHandled("update-setor"), true);
  } finally {
    unregister();
    consumeAuditRequestHandled("create-setor");
    consumeAuditRequestHandled("delete-setor");
  }
});

test("failed setor audit listener keeps HTTP hook fallback available", async () => {
  const events = new FakeSetorEventSubscriber();
  let logged = false;
  const unregister = registerSetorAuditHandlers(
    events,
    { record: async () => { throw new Error("outbox unavailable"); } },
    { error() { logged = true; } } as any,
  );

  try {
    await events.created?.({
      context: context("failed-setor"),
      setor: new Setor(2, "TI", "Tecnologia"),
    });
    assert.equal(logged, true);
    assert.equal(consumeAuditRequestHandled("failed-setor"), false);
  } finally {
    unregister();
  }
});
