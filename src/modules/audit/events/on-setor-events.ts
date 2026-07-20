import { FastifyBaseLogger } from "fastify";
import { SetorCreatedEvent } from "../../setor/application/events/setor-created.event.js";
import { SetorDeletedEvent } from "../../setor/application/events/setor-deleted.event.js";
import { SetorEventSubscriber } from "../../setor/application/events/setor-event-subscriber.js";
import { SetorUpdatedEvent } from "../../setor/application/events/setor-updated.event.js";
import { RecordAuditDto } from "../application/dto/audit.dto.js";
import { markAuditRequestHandled } from "./audit-request-registry.js";

interface AuditRecorder {
  record(input: RecordAuditDto): Promise<unknown>;
}

type SetorAuditEvent =
  | SetorCreatedEvent
  | SetorUpdatedEvent
  | SetorDeletedEvent;

const baseRecord = (event: SetorAuditEvent): Omit<
  RecordAuditDto,
  "action" | "resourceId"
> => ({
  actor: {
    userId: event.context.actor?.id ?? null,
    name: event.context.actor?.name ?? null,
    roleId: event.context.actor?.roleId ?? null,
    setorId: event.context.actor?.setorId ?? null,
  },
  module: "setor",
  resourceType: "setor",
  result: "SUCCESS",
  requestId: event.context.correlationId,
  ip: event.context.origin?.ip ?? null,
  method: event.context.origin?.method ?? null,
  route: event.context.origin?.route ?? null,
});

export const registerSetorAuditHandlers = (
  setorEvents: SetorEventSubscriber,
  auditService: AuditRecorder,
  logger: Pick<FastifyBaseLogger, "error">,
) => {
  const record = async (event: SetorAuditEvent, input: RecordAuditDto) => {
    try {
      await auditService.record(input);
      markAuditRequestHandled(event.context.correlationId);
    } catch (error) {
      logger.error(
        { err: error, requestId: event.context.correlationId },
        "Unable to enqueue setor audit event",
      );
    }
  };

  const unsubscribe = [
    setorEvents.onCreated((event) =>
      record(event, {
        ...baseRecord(event),
        action: "CREATE",
        resourceId: String(event.setor.id),
        before: null,
        after: event.setor,
      }),
    ),
    setorEvents.onUpdated((event) =>
      record(event, {
        ...baseRecord(event),
        action: "UPDATE",
        resourceId: String(event.after.id),
        before: event.before,
        after: event.after,
      }),
    ),
    setorEvents.onDeleted((event) =>
      record(event, {
        ...baseRecord(event),
        action: "DELETE",
        resourceId: String(event.before.id),
        before: event.before,
        after: null,
      }),
    ),
  ];

  return () => unsubscribe.forEach((off) => off());
};
