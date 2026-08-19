import { FastifyBaseLogger } from "fastify";
import { EventSubscriber } from "../../../core/event/event-contracts.js";
import {
  MunicipeEventMap,
  MUNICIPE_EVENTS,
} from "../../municipe/application/events/municipe.events.js";
import { AuditRecorder } from "../application/contracts/audit-recorder.js";
import { makeAuditBaseRecord, recordAuditEvent } from "./audit-event-recorder.js";

export const registerMunicipeAuditHandlers = (
  events: EventSubscriber<MunicipeEventMap>,
  auditService: AuditRecorder,
  logger: Pick<FastifyBaseLogger, "error">,
) => {
  const unsubscribe = [
    events.subscribe(MUNICIPE_EVENTS.created, (event) =>
      recordAuditEvent(event, {
        ...makeAuditBaseRecord(event, "municipe", "municipe"),
        action: "CREATE",
        resourceId: event.after.uuid ?? null,
        result: "SUCCESS",
        before: null,
        after: event.after,
      }, auditService, logger),
    ),
    events.subscribe(MUNICIPE_EVENTS.updated, (event) =>
      recordAuditEvent(event, {
        ...makeAuditBaseRecord(event, "municipe", "municipe"),
        action: "UPDATE",
        resourceId: event.after.uuid ?? null,
        result: "SUCCESS",
        before: event.before,
        after: event.after,
      }, auditService, logger),
    ),
  ];
  return () => unsubscribe.forEach((off) => off());
};
