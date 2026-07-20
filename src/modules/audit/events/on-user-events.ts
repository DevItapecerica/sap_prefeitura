import { FastifyBaseLogger } from "fastify";
import { UserEventSubscriber } from "../../user/application/events/user-event-bus.js";
import {
  UserCreatedEvent,
  UserDeletedEvent,
  UserPasswordChangedEvent,
  UserUpdatedEvent,
} from "../../user/application/events/user.events.js";
import {
  AuditRecorder,
  makeAuditBaseRecord,
  recordAuditEvent,
} from "./audit-event-recorder.js";

type UserAuditEvent =
  | UserCreatedEvent
  | UserUpdatedEvent
  | UserDeletedEvent
  | UserPasswordChangedEvent;

export const registerUserAuditHandlers = (
  userEvents: UserEventSubscriber,
  auditService: AuditRecorder,
  logger: Pick<FastifyBaseLogger, "error">,
) => {
  const record = (
    event: UserAuditEvent,
    data: Parameters<AuditRecorder["record"]>[0],
  ) => recordAuditEvent(event, data, auditService, logger);
  const base = (event: UserAuditEvent) =>
    makeAuditBaseRecord(event, "user", "user");

  const unsubscribe = [
    userEvents.onCreated((event) =>
      record(event, {
        ...base(event),
        action: "CREATE",
        resourceId: String(event.user.id),
        before: null,
        after: event.user,
      }),
    ),
    userEvents.onUpdated((event) =>
      record(event, {
        ...base(event),
        action: "UPDATE",
        resourceId: String(event.after.id),
        before: event.before,
        after: event.after,
      }),
    ),
    userEvents.onDeleted((event) =>
      record(event, {
        ...base(event),
        action: "DELETE",
        resourceId: String(event.before.id),
        before: event.before,
        after: null,
      }),
    ),
    userEvents.onPasswordChanged((event) =>
      record(event, {
        ...base(event),
        action: "PASSWORD_CHANGED",
        resourceId: String(event.userId),
      }),
    ),
  ];
  return () => unsubscribe.forEach((off) => off());
};
