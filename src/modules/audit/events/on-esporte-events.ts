import { FastifyBaseLogger } from "fastify";
import { EventSubscriber } from "../../../core/event/event-contracts.js";
import {
  AtletaModalidadesUpdatedEvent,
  ESPORTE_EVENTS,
  EsporteCreatedEvent,
  EsporteDeletedEvent,
  EsporteEventMap,
  EsporteUpdatedEvent,
} from "../../esporte/application/events/esporte.events.js";
import { AuditRecorder } from "../application/contracts/audit-recorder.js";
import { makeAuditBaseRecord, recordAuditEvent } from "./audit-event-recorder.js";

export const registerEsporteAuditHandlers = (
  events: EventSubscriber<EsporteEventMap>,
  auditService: AuditRecorder,
  logger: Pick<FastifyBaseLogger, "error">,
) => {
  const id = (snapshot: Record<string, unknown>) =>
    String(snapshot.uuid ?? snapshot.id ?? "");
  const created = (event: EsporteCreatedEvent) =>
    recordAuditEvent(event, {
      ...makeAuditBaseRecord(event, "esporte", event.resourceType),
      action: "CREATE", resourceId: id(event.after), result: "SUCCESS",
      before: null, after: event.after,
    }, auditService, logger);
  const updated = (event: EsporteUpdatedEvent) =>
    recordAuditEvent(event, {
      ...makeAuditBaseRecord(event, "esporte", event.resourceType),
      action: "UPDATE", resourceId: id(event.after), result: "SUCCESS",
      before: event.before, after: event.after,
    }, auditService, logger);
  const deleted = (event: EsporteDeletedEvent) =>
    recordAuditEvent(event, {
      ...makeAuditBaseRecord(event, "esporte", event.resourceType),
      action: "DELETE", resourceId: id(event.before), result: "SUCCESS",
      before: event.before, after: null,
    }, auditService, logger);
  const modalidadesUpdated = (event: AtletaModalidadesUpdatedEvent) =>
    recordAuditEvent(event, {
      ...makeAuditBaseRecord(event, "esporte", "atleta"),
      action: "UPDATE", resourceId: id(event.after), result: "SUCCESS",
      before: event.before, after: event.after,
    }, auditService, logger);

  const unsubscribe = [
    events.subscribe(ESPORTE_EVENTS.atletaCreated, created),
    events.subscribe(ESPORTE_EVENTS.modalidadeCreated, created),
    events.subscribe(ESPORTE_EVENTS.carterinhaCreated, created),
    events.subscribe(ESPORTE_EVENTS.atletaUpdated, updated),
    events.subscribe(ESPORTE_EVENTS.modalidadeUpdated, updated),
    events.subscribe(ESPORTE_EVENTS.atletaDeleted, deleted),
    events.subscribe(ESPORTE_EVENTS.modalidadeDeleted, deleted),
    events.subscribe(
      ESPORTE_EVENTS.atletaModalidadesUpdated,
      modalidadesUpdated,
    ),
  ];
  return () => unsubscribe.forEach((off) => off());
};
