import { FastifyBaseLogger } from "fastify";
import { PermissionEventSubscriber } from "../../permission/application/events/permission-event-bus.js";
import { PermissionUpdatedEvent } from "../../permission/application/events/permission.events.js";
import {
  AuditRecorder,
  makeAuditBaseRecord,
  recordAuditEvent,
} from "./audit-event-recorder.js";

export const registerPermissionAuditHandlers = (
  permissionEvents: PermissionEventSubscriber,
  auditService: AuditRecorder,
  logger: Pick<FastifyBaseLogger, "error">,
) => {
  const unsubscribe = permissionEvents.onUpdated((event) =>
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
