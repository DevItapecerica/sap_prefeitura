import { FastifyBaseLogger } from "fastify";
import { ServiceEventSubscriber } from "../../services/application/events/service-event-bus.js";
import {
  ServiceCreatedEvent,
  ServiceDeletedEvent,
  ServiceUpdatedEvent,
} from "../../services/application/events/service.events.js";
import {
  AuditRecorder,
  makeAuditBaseRecord,
  recordAuditEvent,
} from "./audit-event-recorder.js";

type ServiceAuditEvent = ServiceCreatedEvent | ServiceUpdatedEvent | ServiceDeletedEvent;

export const registerServiceAuditHandlers = (
  serviceEvents: ServiceEventSubscriber,
  auditService: AuditRecorder,
  logger: Pick<FastifyBaseLogger, "error">,
) => {
  const record = (
    event: ServiceAuditEvent,
    data: Parameters<AuditRecorder["record"]>[0],
  ) => recordAuditEvent(event, data, auditService, logger);
  const base = (event: ServiceAuditEvent) =>
    makeAuditBaseRecord(event, "service", "service");

  const unsubscribe = [
    serviceEvents.onCreated((event) =>
      record(event, {
        ...base(event),
        action: "CREATE",
        resourceId: String(event.service.id),
        before: null,
        after: event.service,
      }),
    ),
    serviceEvents.onUpdated((event) =>
      record(event, {
        ...base(event),
        action: "UPDATE",
        resourceId: String(event.after.services.id),
        before: event.before,
        after: event.after,
      }),
    ),
    serviceEvents.onDeleted((event) =>
      record(event, {
        ...base(event),
        action: "DELETE",
        resourceId: String(event.before.services.id),
        before: event.before,
        after: null,
      }),
    ),
  ];
  return () => unsubscribe.forEach((off) => off());
};
