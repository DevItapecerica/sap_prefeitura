import assert from "node:assert/strict";
import test from "node:test";
import { ApplicationEventContext } from "../../../../core/event/application-event.js";
import { ServiceCreatedEvent } from "../../../services/application/events/service-created.event.js";
import { ServiceDeletedEvent } from "../../../services/application/events/service-deleted.event.js";
import { ServiceEventHandler } from "../../../services/application/events/service-event-handler.js";
import { ServiceEventSubscriber } from "../../../services/application/events/service-event-subscriber.js";
import { ServiceUpdatedEvent } from "../../../services/application/events/service-updated.event.js";
import { Services } from "../../../services/domain/entity/Services.js";
import { RecordAuditDto } from "../../application/dto/audit.dto.js";
import { consumeAuditRequestHandled } from "../audit-request-registry.js";
import { registerServiceAuditHandlers } from "../on-service-events.js";

class FakeServiceEventSubscriber implements ServiceEventSubscriber {
  created?: ServiceEventHandler<ServiceCreatedEvent>;
  updated?: ServiceEventHandler<ServiceUpdatedEvent>;
  deleted?: ServiceEventHandler<ServiceDeletedEvent>;

  onCreated(handler: ServiceEventHandler<ServiceCreatedEvent>) {
    this.created = handler;
    return () => { if (this.created === handler) this.created = undefined; };
  }
  onUpdated(handler: ServiceEventHandler<ServiceUpdatedEvent>) {
    this.updated = handler;
    return () => { if (this.updated === handler) this.updated = undefined; };
  }
  onDeleted(handler: ServiceEventHandler<ServiceDeletedEvent>) {
    this.deleted = handler;
    return () => { if (this.deleted === handler) this.deleted = undefined; };
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
    assert.equal(consumeAuditRequestHandled("update-service"), true);
  } finally {
    unregister();
    consumeAuditRequestHandled("create-service");
    consumeAuditRequestHandled("delete-service");
  }
});

test("failed service audit listener keeps HTTP hook fallback available", async () => {
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
    assert.equal(consumeAuditRequestHandled("failed-service"), false);
  } finally {
    unregister();
  }
});
