import { FastifyBaseLogger } from "fastify";
import { EventSubscriber } from "../../../core/event/event-contracts.js";
import {
  ResourceExportedEvent,
  ResourceListedEvent,
  ResourceViewedEvent,
  ResourceReadEventMap,
  RESOURCE_READ_EVENTS,
} from "../../../core/event/resource-read.events.js";
import {
  AuditRecorder,
  makeAuditBaseRecord,
  recordAuditEvent,
} from "./audit-event-recorder.js";

type ResourceReadEvent =
  | ResourceListedEvent
  | ResourceViewedEvent
  | ResourceExportedEvent;

export const registerResourceReadAuditHandlers = (
  events: EventSubscriber<ResourceReadEventMap>,
  auditService: AuditRecorder,
  logger: Pick<FastifyBaseLogger, "error">,
) => {
  const base = (event: ResourceReadEvent) =>
    makeAuditBaseRecord(event, event.module, event.resourceType);

  const unsubscribe = [
    events.subscribe(RESOURCE_READ_EVENTS.listed, (event) =>
      recordAuditEvent(
        event,
        {
          ...base(event),
          action: "LIST",
          resourceId: null,
          filters: event.filters,
          returnedCount: event.returnedCount,
        },
        auditService,
        logger,
      ),
    ),
    events.subscribe(RESOURCE_READ_EVENTS.viewed, (event) =>
      recordAuditEvent(
        event,
        {
          ...base(event),
          action: "VIEW",
          resourceId: event.resourceId,
        },
        auditService,
        logger,
      ),
    ),
    events.subscribe(RESOURCE_READ_EVENTS.exported, (event) =>
      recordAuditEvent(
        event,
        {
          ...base(event),
          action: "EXPORT",
          resourceId: event.resourceId ?? null,
          filters: event.filters,
          returnedCount: event.returnedCount,
        },
        auditService,
        logger,
      ),
    ),
  ];

  return () => unsubscribe.forEach((off) => off());
};
