import assert from "node:assert/strict";
import test from "node:test";
import { ApplicationEventContext } from "../../../../core/event/application-event.js";
import { EventHandler } from "../../../../core/event/event-contracts.js";
import { SETOR_EVENTS, SetorCreatedEvent, SetorDeletedEvent, SetorUpdatedEvent } from "../../../setor/application/events/setor.events.js";
import { Setor } from "../../../setor/domain/entity/Setor.js";
import { RecordAuditDto } from "../../application/dto/audit.dto.js";
import { registerSetorAuditHandlers } from "../on-setor-events.js";

class FakeSetorEventSubscriber {
  created?: EventHandler<SetorCreatedEvent>;
  updated?: EventHandler<SetorUpdatedEvent>;
  deleted?: EventHandler<SetorDeletedEvent>;

  subscribe(eventName: string, handler: EventHandler<any>) {
    const property = {
      [SETOR_EVENTS.created]: "created",
      [SETOR_EVENTS.updated]: "updated",
      [SETOR_EVENTS.deleted]: "deleted",
    }[eventName] as "created" | "updated" | "deleted";
    (this as any)[property] = handler;
    return () => {
      if ((this as any)[property] === handler) (this as any)[property] = undefined;
    };
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
  } finally {
    unregister();
  }
});

test("failed setor audit listener remains best-effort", async () => {
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
  } finally {
    unregister();
  }
});
