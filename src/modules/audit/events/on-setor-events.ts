import { FastifyBaseLogger } from "fastify";
import { SetorEventSubscriber } from "../../setor/application/events/setor-event-bus.js";
import {
  SetorCreatedEvent,
  SetorDeletedEvent,
  SetorUpdatedEvent,
} from "../../setor/application/events/setor.events.js";
import {
  AuditRecorder,
  makeAuditBaseRecord,
  recordAuditEvent,
} from "./audit-event-recorder.js";

type SetorAuditEvent = SetorCreatedEvent | SetorUpdatedEvent | SetorDeletedEvent;

export const registerSetorAuditHandlers = (
  setorEvents: SetorEventSubscriber,
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
    setorEvents.onCreated((event) =>
      record(event, {
        ...base(event),
        action: "CREATE",
        resourceId: String(event.setor.id),
        before: null,
        after: event.setor,
      }),
    ),
    setorEvents.onUpdated((event) =>
      record(event, {
        ...base(event),
        action: "UPDATE",
        resourceId: String(event.after.id),
        before: event.before,
        after: event.after,
      }),
    ),
    setorEvents.onDeleted((event) =>
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
