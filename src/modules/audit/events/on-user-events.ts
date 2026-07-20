import { FastifyBaseLogger } from "fastify";
import { UserCreatedEvent } from "../../user/application/events/user-created.event.js";
import { UserDeletedEvent } from "../../user/application/events/user-deleted.event.js";
import { UserEventSubscriber } from "../../user/application/events/user-event-subscriber.js";
import { UserPasswordChangedEvent } from "../../user/application/events/user-password-changed.event.js";
import { UserUpdatedEvent } from "../../user/application/events/user-updated.event.js";
import { RecordAuditDto } from "../application/dto/audit.dto.js";
import { markAuditRequestHandled } from "./audit-request-registry.js";

interface AuditRecorder {
  record(input: RecordAuditDto): Promise<unknown>;
}

type UserAuditEvent =
  | UserCreatedEvent
  | UserUpdatedEvent
  | UserDeletedEvent
  | UserPasswordChangedEvent;

const baseRecord = (event: UserAuditEvent): Omit<
  RecordAuditDto,
  "action" | "resourceId"
> => ({
  actor: {
    userId: event.context.actor?.id ?? null,
    name: event.context.actor?.name ?? null,
    roleId: event.context.actor?.roleId ?? null,
    setorId: event.context.actor?.setorId ?? null,
  },
  module: "user",
  resourceType: "user",
  result: "SUCCESS",
  requestId: event.context.correlationId,
  ip: event.context.origin?.ip ?? null,
  method: event.context.origin?.method ?? null,
  route: event.context.origin?.route ?? null,
});

export const registerUserAuditHandlers = (
  userEvents: UserEventSubscriber,
  auditService: AuditRecorder,
  logger: Pick<FastifyBaseLogger, "error">,
) => {
  const record = async (event: UserAuditEvent, input: RecordAuditDto) => {
    try {
      await auditService.record(input);
      markAuditRequestHandled(event.context.correlationId);
    } catch (error) {
      logger.error(
        { err: error, requestId: event.context.correlationId },
        "Unable to enqueue user audit event",
      );
    }
  };

  const onCreated = (event: UserCreatedEvent) =>
    record(event, {
      ...baseRecord(event),
      action: "CREATE",
      resourceId: event.user.id == null ? null : String(event.user.id),
      before: null,
      after: event.user,
    });

  const onUpdated = (event: UserUpdatedEvent) =>
    record(event, {
      ...baseRecord(event),
      action: "UPDATE",
      resourceId: event.after.id == null ? null : String(event.after.id),
      before: event.before,
      after: event.after,
    });

  const onDeleted = (event: UserDeletedEvent) =>
    record(event, {
      ...baseRecord(event),
      action: "DELETE",
      resourceId: event.before.id == null ? null : String(event.before.id),
      before: event.before,
      after: null,
    });

  const onPasswordChanged = (event: UserPasswordChangedEvent) =>
    record(event, {
      ...baseRecord(event),
      action: "PASSWORD_CHANGED",
      resourceId: String(event.userId),
    });

  const unsubscribe = [
    userEvents.onCreated(onCreated),
    userEvents.onUpdated(onUpdated),
    userEvents.onDeleted(onDeleted),
    userEvents.onPasswordChanged(onPasswordChanged),
  ];

  return () => {
    unsubscribe.forEach((off) => off());
  };
};
