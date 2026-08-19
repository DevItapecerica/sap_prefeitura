import { FastifyBaseLogger } from "fastify";
import { EventSubscriber } from "../../../core/event/event-contracts.js";
import {
  UserCreatedEvent,
  UserDeletedEvent,
  UserPasswordChangedEvent,
  UserUpdatedEvent,
  UserEventMap,
  USER_EVENTS,
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
  userEvents: EventSubscriber<UserEventMap>,
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
    userEvents.subscribe(USER_EVENTS.created, (event) =>
      record(event, {
        ...base(event),
        action: "CREATE",
        resourceId: String(event.user.id),
        before: null,
        after: event.user,
      }),
    ),
    userEvents.subscribe(USER_EVENTS.updated, (event) =>
      record(event, {
        ...base(event),
        action: "UPDATE",
        resourceId: String(event.after.id),
        before: event.before,
        after: event.after,
      }),
    ),
    userEvents.subscribe(USER_EVENTS.deleted, (event) =>
      record(event, {
        ...base(event),
        action: "DELETE",
        resourceId: String(event.before.id),
        before: event.before,
        after: null,
      }),
    ),
    userEvents.subscribe(USER_EVENTS.passwordChanged, (event) =>
      record(event, {
        ...base(event),
        action: "PASSWORD_CHANGED",
        resourceId: String(event.userId),
      }),
    ),
  ];
  return () => unsubscribe.forEach((off) => off());
};
