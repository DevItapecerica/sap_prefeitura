import { FastifyBaseLogger } from "fastify";
import { EventSubscriber } from "../../../core/event/event-contracts.js";
import {
  FtEditalEventMap,
  FT_EDITAL_EVENTS,
} from "../../ft-edital/application/events/ft-edital.events.js";
import { AuditRecorder } from "../application/contracts/audit-recorder.js";
import { makeAuditBaseRecord, recordAuditEvent } from "./audit-event-recorder.js";

const id = (value: any) => String(value?.id ?? value?.uuid ?? value?.get?.("id") ?? "");
export const registerFtEditalAuditHandlers = (
  events: EventSubscriber<FtEditalEventMap>,
  auditService: AuditRecorder,
  logger: Pick<FastifyBaseLogger, "error">,
) => {
  const unsubscribe = [
    events.subscribe(FT_EDITAL_EVENTS.created, (event) => recordAuditEvent(event, {
      ...makeAuditBaseRecord(event, "ft-edital", "edital"), action: "CREATE",
      resourceId: id(event.after), result: "SUCCESS", before: null, after: event.after,
    }, auditService, logger)),
    events.subscribe(FT_EDITAL_EVENTS.updated, (event) => recordAuditEvent(event, {
      ...makeAuditBaseRecord(event, "ft-edital", "edital"), action: "UPDATE",
      resourceId: id(event.after), result: "SUCCESS", before: event.before, after: event.after,
    }, auditService, logger)),
    events.subscribe(FT_EDITAL_EVENTS.deleted, (event) => recordAuditEvent(event, {
      ...makeAuditBaseRecord(event, "ft-edital", "edital"), action: "DELETE",
      resourceId: event.resourceId, result: "SUCCESS", before: event.before, after: null,
    }, auditService, logger)),
    events.subscribe(FT_EDITAL_EVENTS.bolsistasLinked, (event) => recordAuditEvent(event, {
      ...makeAuditBaseRecord(event, "ft-edital", "edital_bolsista"), action: "CREATE",
      resourceId: event.editalId, result: "SUCCESS", before: null, after: event.after,
    }, auditService, logger)),
  ];
  return () => unsubscribe.forEach((off) => off());
};
