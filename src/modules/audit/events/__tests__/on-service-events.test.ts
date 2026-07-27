import assert from "node:assert/strict";
import test from "node:test";
import { ApplicationEventContext } from "../../../../core/event/application-event.js";
import { EventHandler } from "../../../../core/event/event-contracts.js";
import { SERVICE_EVENTS, ServiceCreatedEvent, ServiceDeletedEvent, ServiceUpdatedEvent } from "../../../services/application/events/service.events.js";
import { Services } from "../../../services/domain/entity/Services.js";
import { RecordAuditDto } from "../../application/dto/audit.dto.js";
import { registerServiceAuditHandlers } from "../on-service-events.js";

class FakeServiceEventSubscriber {
  created?: EventHandler<ServiceCreatedEvent>;
  updated?: EventHandler<ServiceUpdatedEvent>;
  deleted?: EventHandler<ServiceDeletedEvent>;

  subscribe(eventName: string, handler: EventHandler<any>) {
    const property = {
      [SERVICE_EVENTS.created]: "created",
      [SERVICE_EVENTS.updated]: "updated",
      [SERVICE_EVENTS.deleted]: "deleted",
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
  origin: { type: "HTTP", ip: "127.0.0.1", method: "PUT", route: "/service/:id" },
});

test("service events create audit records with complete aggregates", async () => {
  const events = new FakeServiceEventSubscriber();
  const records: RecordAuditDto[] = [];
  const unregister = registerServiceAuditHandlers(
    events,
    { record: async (input) => records.push(input) },
    { error() {} } as any,
  );
  const beforeService = new Services(6, "FT", "FT", "ft", "/ft", new Date(), new Date(), null);
  const afterService = new Services(6, "FT Atualizado", "FT", "ft", "/ft", new Date(), new Date(), null);
  const before = { services: beforeService, permissions: [], visibility: [] };
  const after = { services: afterService, permissions: [], visibility: [] };

  try {
    await events.created?.({ context: context("create-service"), service: afterService });
    await events.updated?.({ context: context("update-service"), before, after });
    await events.deleted?.({ context: context("delete-service"), before: after });

    assert.deepEqual(records.map((record) => record.action), ["CREATE", "UPDATE", "DELETE"]);
    assert.equal(records[0].before, null);
    assert.equal(records[0].after, afterService);
    assert.equal(records[1].before, before);
    assert.equal(records[1].after, after);
    assert.equal(records[2].before, after);
    assert.equal(records[2].after, null);
  } finally {
    unregister();
  }
});

test("failed service audit listener remains best-effort", async () => {
  const events = new FakeServiceEventSubscriber();
  let logged = false;
  const unregister = registerServiceAuditHandlers(
    events,
    { record: async () => { throw new Error("outbox unavailable"); } },
    { error() { logged = true; } } as any,
  );
  const service = new Services(6, "FT", "FT", "ft", "/ft", new Date(), new Date(), null);

  try {
    await events.created?.({ context: context("failed-service"), service });
    assert.equal(logged, true);
  } finally {
    unregister();
  }
});
