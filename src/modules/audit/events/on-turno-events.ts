import { FastifyBaseLogger } from "fastify";
import { EventSubscriber } from "../../../core/event/event-contracts.js";
import { TURNO_EVENTS, TurnoEventMap } from "../../ft-turno/application/turno.events.js";
import { AuditRecorder } from "../application/contracts/audit-recorder.js";
import { makeAuditBaseRecord, recordAuditEvent } from "./audit-event-recorder.js";

export const registerTurnoAuditHandlers = (events: EventSubscriber<TurnoEventMap>, auditService: AuditRecorder, logger: Pick<FastifyBaseLogger, "error">) => {
  const id = (value: any) => String(value?.uuid ?? value?.get?.("uuid") ?? "");
  const subscriptions = [
    events.subscribe(TURNO_EVENTS.created, (event) => recordAuditEvent(event, { ...makeAuditBaseRecord(event, "ft-turno", "turno"), action: "CREATE", resourceId: id(event.after), result: "SUCCESS", before: null, after: event.after }, auditService, logger)),
    events.subscribe(TURNO_EVENTS.updated, (event) => recordAuditEvent(event, { ...makeAuditBaseRecord(event, "ft-turno", "turno"), action: "UPDATE", resourceId: id(event.after), result: "SUCCESS", before: event.before, after: event.after }, auditService, logger)),
    events.subscribe(TURNO_EVENTS.deleted, (event) => recordAuditEvent(event, { ...makeAuditBaseRecord(event, "ft-turno", "turno"), action: "DELETE", resourceId: event.resourceId, result: "SUCCESS", before: event.before, after: null }, auditService, logger)),
  ];
  return () => subscriptions.forEach((off) => off());
};
