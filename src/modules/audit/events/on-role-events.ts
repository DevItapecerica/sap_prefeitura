import { FastifyBaseLogger } from "fastify";
import { EventSubscriber } from "../../../core/event/event-contracts.js";
import {
  RoleCreatedEvent,
  RoleDeletedEvent,
  RoleUpdatedEvent,
  RoleEventMap,
  ROLE_EVENTS,
} from "../../roles/application/events/role.events.js";
import {
  AuditRecorder,
  makeAuditBaseRecord,
  recordAuditEvent,
} from "./audit-event-recorder.js";

type RoleAuditEvent = RoleCreatedEvent | RoleUpdatedEvent | RoleDeletedEvent;

export const registerRoleAuditHandlers = (
  roleEvents: EventSubscriber<RoleEventMap>,
  auditService: AuditRecorder,
  logger: Pick<FastifyBaseLogger, "error">,
) => {
  const record = (
    event: RoleAuditEvent,
    data: Parameters<AuditRecorder["record"]>[0],
  ) => recordAuditEvent(event, data, auditService, logger);
  const base = (event: RoleAuditEvent) =>
    makeAuditBaseRecord(event, "role", "role");

  const unsubscribe = [
    roleEvents.subscribe(ROLE_EVENTS.created, (event) =>
      record(event, {
        ...base(event),
        action: "CREATE",
        resourceId: String(event.role.id),
        before: null,
        after: event.role,
      }),
    ),
    roleEvents.subscribe(ROLE_EVENTS.updated, (event) =>
      record(event, {
        ...base(event),
        action: "UPDATE",
        resourceId: String(event.after.id),
        before: event.before,
        after: event.after,
      }),
    ),
    roleEvents.subscribe(ROLE_EVENTS.deleted, (event) =>
      record(event, {
        ...base(event),
        action: "DELETE",
        resourceId: String(event.before.role.id),
        before: event.before,
        after: null,
      }),
    ),
  ];
  return () => unsubscribe.forEach((off) => off());
};
