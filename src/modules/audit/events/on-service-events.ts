import { FastifyBaseLogger } from "fastify";
import { EventSubscriber } from "../../../core/event/event-contracts.js";
import {
  ServiceCreatedEvent,
  ServiceDeletedEvent,
  ServiceUpdatedEvent,
  ServiceEventMap,
  SERVICE_EVENTS,
} from "../../services/application/events/service.events.js";
import {
  AuditRecorder,
  makeAuditBaseRecord,
  recordAuditEvent,
} from "./audit-event-recorder.js";

type ServiceAuditEvent = ServiceCreatedEvent | ServiceUpdatedEvent | ServiceDeletedEvent;

export const registerServiceAuditHandlers = (
  serviceEvents: EventSubscriber<ServiceEventMap>,
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
    serviceEvents.subscribe(SERVICE_EVENTS.created, (event) =>
      record(event, {
        ...base(event),
        action: "CREATE",
        resourceId: String(event.service.id),
        before: null,
        after: event.service,
      }),
    ),
    serviceEvents.subscribe(SERVICE_EVENTS.updated, (event) =>
      record(event, {
        ...base(event),
        action: "UPDATE",
        resourceId: String(event.after.services.id),
        before: event.before,
        after: event.after,
      }),
    ),
    serviceEvents.subscribe(SERVICE_EVENTS.deleted, (event) =>
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
