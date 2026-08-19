import { FastifyBaseLogger } from "fastify";
import { EventSubscriber } from "../../../core/event/event-contracts.js";
import {
  AuthEventMap,
  AUTH_EVENTS,
} from "../../auth/application/events/auth.events.js";
import { AuditRecorder } from "../application/contracts/audit-recorder.js";
import { makeAuditBaseRecord, recordAuditEvent } from "./audit-event-recorder.js";

export const registerAuthAuditHandlers = (
  events: EventSubscriber<AuthEventMap>,
  auditService: AuditRecorder,
  logger: Pick<FastifyBaseLogger, "error">,
) => {
  const unsubscribe = [
    events.subscribe(AUTH_EVENTS.loginSucceeded, (event) =>
      recordAuditEvent(
        event,
        {
          ...makeAuditBaseRecord(event, "auth", "session"),
          action: "LOGIN",
          resourceId: String(event.context.actor?.id ?? ""),
          result: "SUCCESS",
        },
        auditService,
        logger,
      ),
    ),
    events.subscribe(AUTH_EVENTS.logoutSucceeded, (event) =>
      recordAuditEvent(
        event,
        {
          ...makeAuditBaseRecord(event, "auth", "session"),
          action: "LOGOUT",
          resourceId: event.userId === null ? null : String(event.userId),
          result: "SUCCESS",
        },
        auditService,
        logger,
      ),
    ),
  ];
  return () => unsubscribe.forEach((off) => off());
};
