import { FastifyBaseLogger } from "fastify";
import { EventSubscriber } from "../../../core/event/event-contracts.js";
import {
  FtBolsistaEventMap,
  FT_BOLSISTA_EVENTS,
} from "../../ft-bolsista/application/events/ft-bolsista.events.js";
import { AuditRecorder } from "../application/contracts/audit-recorder.js";
import { makeAuditBaseRecord, recordAuditEvent } from "./audit-event-recorder.js";

const id = (value: any) => String(value?.id ?? value?.uuid ?? value?.get?.("id") ?? "");
export const registerFtBolsistaAuditHandlers = (
  events: EventSubscriber<FtBolsistaEventMap>,
  auditService: AuditRecorder,
  logger: Pick<FastifyBaseLogger, "error">,
) => {
  const unsubscribe = [
    events.subscribe(FT_BOLSISTA_EVENTS.created, (event) => recordAuditEvent(event, {
      ...makeAuditBaseRecord(event, "ft-bolsista", event.resourceType),
      action: "CREATE", resourceId: event.resourceId ?? id(event.after),
      result: "SUCCESS", before: null, after: event.after,
    }, auditService, logger)),
    events.subscribe(FT_BOLSISTA_EVENTS.updated, (event) => recordAuditEvent(event, {
      ...makeAuditBaseRecord(event, "ft-bolsista", event.resourceType),
      action: "UPDATE", resourceId: event.resourceId ?? id(event.after),
      result: "SUCCESS", before: event.before, after: event.after,
    }, auditService, logger)),
    events.subscribe(FT_BOLSISTA_EVENTS.deleted, (event) => recordAuditEvent(event, {
      ...makeAuditBaseRecord(event, "ft-bolsista", event.resourceType),
      action: "DELETE", resourceId: event.resourceId,
      result: "SUCCESS", before: event.before, after: null,
    }, auditService, logger)),
  ];
  return () => unsubscribe.forEach((off) => off());
};
