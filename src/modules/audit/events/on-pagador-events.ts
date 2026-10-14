import { FastifyBaseLogger } from "fastify";
import { EventSubscriber } from "../../../core/event/event-contracts.js";
import {
  PAGADOR_EVENTS,
  PagadorEventMap,
} from "../../ft-pagador/application/pagador.events.js";
import { AuditRecorder } from "../application/contracts/audit-recorder.js";
import {
  makeAuditBaseRecord,
  recordAuditEvent,
} from "./audit-event-recorder.js";

export const registerPagadorAuditHandlers = (
  events: EventSubscriber<PagadorEventMap>,
  auditService: AuditRecorder,
  logger: Pick<FastifyBaseLogger, "error">,
) => {
  const id = (value: any) => String(value?.uuid ?? value?.get?.("uuid") ?? "");
  const unsubscribe = [
    events.subscribe(PAGADOR_EVENTS.created, (event) =>
      recordAuditEvent(
        event,
        {
          ...makeAuditBaseRecord(event, "ft-pagador", "pagador"),
          action: "CREATE",
          resourceId: id(event.after),
          result: "SUCCESS",
          before: null,
          after: event.after,
        },
        auditService,
        logger,
      ),
    ),
    events.subscribe(PAGADOR_EVENTS.updated, (event) =>
      recordAuditEvent(
        event,
        {
          ...makeAuditBaseRecord(event, "ft-pagador", "pagador"),
          action: "UPDATE",
          resourceId: id(event.after),
          result: "SUCCESS",
          before: event.before,
          after: event.after,
        },
        auditService,
        logger,
      ),
    ),
    events.subscribe(PAGADOR_EVENTS.deleted, (event) =>
      recordAuditEvent(
        event,
        {
          ...makeAuditBaseRecord(event, "ft-pagador", "pagador"),
          action: "DELETE",
          resourceId: event.resourceId,
          result: "SUCCESS",
          before: event.before,
          after: null,
        },
        auditService,
        logger,
      ),
    ),
  ];
  return () => unsubscribe.forEach((off) => off());
};
