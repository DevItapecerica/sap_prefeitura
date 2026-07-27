import { FastifyBaseLogger } from "fastify";
import { EventSubscriber } from "../../../core/event/event-contracts.js";
import {
  SetorCreatedEvent,
  SetorDeletedEvent,
  SetorUpdatedEvent,
  SetorEventMap,
  SETOR_EVENTS,
} from "../../setor/application/events/setor.events.js";
import {
  AuditRecorder,
  makeAuditBaseRecord,
  recordAuditEvent,
} from "./audit-event-recorder.js";

type SetorAuditEvent = SetorCreatedEvent | SetorUpdatedEvent | SetorDeletedEvent;

export const registerSetorAuditHandlers = (
  setorEvents: EventSubscriber<SetorEventMap>,
  auditService: AuditRecorder,
  logger: Pick<FastifyBaseLogger, "error">,
) => {
  const record = (
    event: SetorAuditEvent,
    data: Parameters<AuditRecorder["record"]>[0],
  ) => recordAuditEvent(event, data, auditService, logger);
  const base = (event: SetorAuditEvent) =>
    makeAuditBaseRecord(event, "setor", "setor");

  const unsubscribe = [
    setorEvents.subscribe(SETOR_EVENTS.created, (event) =>
      record(event, {
        ...base(event),
        action: "CREATE",
        resourceId: String(event.setor.id),
        before: null,
        after: event.setor,
      }),
    ),
    setorEvents.subscribe(SETOR_EVENTS.updated, (event) =>
      record(event, {
        ...base(event),
        action: "UPDATE",
        resourceId: String(event.after.id),
        before: event.before,
        after: event.after,
      }),
    ),
    setorEvents.subscribe(SETOR_EVENTS.deleted, (event) =>
      record(event, {
        ...base(event),
        action: "DELETE",
        resourceId: String(event.before.id),
        before: event.before,
        after: null,
      }),
    ),
  ];
  return () => unsubscribe.forEach((off) => off());
};
