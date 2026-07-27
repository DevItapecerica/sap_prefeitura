import { FastifyBaseLogger } from "fastify";
import { EventSubscriber } from "../../../core/event/event-contracts.js";
import {
  PermissionEventMap,
  PERMISSION_EVENTS,
} from "../../permission/application/events/permission.events.js";
import {
  AuditRecorder,
  makeAuditBaseRecord,
  recordAuditEvent,
} from "./audit-event-recorder.js";

export const registerPermissionAuditHandlers = (
  permissionEvents: EventSubscriber<PermissionEventMap>,
  auditService: AuditRecorder,
  logger: Pick<FastifyBaseLogger, "error">,
) => {
  const unsubscribe = permissionEvents.subscribe(PERMISSION_EVENTS.updated, (event) =>
    recordAuditEvent(
      event,
      {
        ...makeAuditBaseRecord(event, "permission", "permission"),
        action: "UPDATE",
        resourceId: String(event.after.id),
        before: event.before,
        after: event.after,
      },
      auditService,
      logger,
    ),
  );
  return () => unsubscribe();
};
