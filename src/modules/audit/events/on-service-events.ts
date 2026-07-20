import { FastifyBaseLogger } from "fastify";
import { ServiceCreatedEvent } from "../../services/application/events/service-created.event.js";
import { ServiceDeletedEvent } from "../../services/application/events/service-deleted.event.js";
import { ServiceEventSubscriber } from "../../services/application/events/service-event-subscriber.js";
import { ServiceUpdatedEvent } from "../../services/application/events/service-updated.event.js";
import { RecordAuditDto } from "../application/dto/audit.dto.js";
import { markAuditRequestHandled } from "./audit-request-registry.js";

interface AuditRecorder {
  record(input: RecordAuditDto): Promise<unknown>;
}

type ServiceAuditEvent =
  | ServiceCreatedEvent
  | ServiceUpdatedEvent
  | ServiceDeletedEvent;

const baseRecord = (event: ServiceAuditEvent): Omit<
  RecordAuditDto,
  "action" | "resourceId"
> => ({
  actor: {
    userId: event.context.actor?.id ?? null,
    name: event.context.actor?.name ?? null,
    roleId: event.context.actor?.roleId ?? null,
    setorId: event.context.actor?.setorId ?? null,
  },
  module: "service",
  resourceType: "service",
  result: "SUCCESS",
  requestId: event.context.correlationId,
  ip: event.context.origin?.ip ?? null,
  method: event.context.origin?.method ?? null,
  route: event.context.origin?.route ?? null,
});

export const registerServiceAuditHandlers = (
  serviceEvents: ServiceEventSubscriber,
  auditService: AuditRecorder,
  logger: Pick<FastifyBaseLogger, "error">,
) => {
  const record = async (event: ServiceAuditEvent, input: RecordAuditDto) => {
    try {
      await auditService.record(input);
      markAuditRequestHandled(event.context.correlationId);
    } catch (error) {
      logger.error(
        { err: error, requestId: event.context.correlationId },
        "Unable to enqueue service audit event",
      );
    }
  };

  const unsubscribe = [
    serviceEvents.onCreated((event) =>
      record(event, {
        ...baseRecord(event),
        action: "CREATE",
        resourceId: String(event.service.id),
        before: null,
        after: event.service,
      }),
    ),
    serviceEvents.onUpdated((event) =>
      record(event, {
        ...baseRecord(event),
        action: "UPDATE",
        resourceId: String(event.after.services.id),
        before: event.before,
        after: event.after,
      }),
    ),
    serviceEvents.onDeleted((event) =>
      record(event, {
        ...baseRecord(event),
        action: "DELETE",
        resourceId: String(event.before.services.id),
        before: event.before,
        after: null,
      }),
    ),
  ];

  return () => unsubscribe.forEach((off) => off());
};
