import { FastifyBaseLogger } from "fastify";
import { EventSubscriber } from "../../../core/event/event-contracts.js";
import {
  HttpRequestFailedEventMap,
  HTTP_REQUEST_FAILED_EVENT,
} from "../../../core/event/http-request-failed.events.js";
import { AuditRecorder } from "../application/contracts/audit-recorder.js";
import { makeAuditBaseRecord, recordAuditEvent } from "./audit-event-recorder.js";

const getFailureMetadata = (event: {
  action: string;
  attemptedIdentity?: string;
  requestedChanges?: unknown;
}) => {
  if (event.action === "LOGIN_FAILED") {
    return { attemptedIdentity: event.attemptedIdentity };
  }
  if (event.requestedChanges !== undefined) {
    return { requestedChanges: event.requestedChanges };
  }
  return undefined;
};

export const registerHttpRequestFailedAuditHandler = (
  events: EventSubscriber<HttpRequestFailedEventMap>,
  auditService: AuditRecorder,
  logger: Pick<FastifyBaseLogger, "error">,
) =>
  events.subscribe(HTTP_REQUEST_FAILED_EVENT, (event) =>
    recordAuditEvent(
      event,
      {
        ...makeAuditBaseRecord(event, event.module, event.resourceType),
        action: event.action,
        resourceId: event.resourceId ?? null,
        result:
          event.action === "ACCESS_DENIED" ? "DENIED" : "FAILURE",
        errorCode: event.errorCode,
        filters: event.filters,
        metadata: getFailureMetadata(event),
      },
      auditService,
      logger,
    ),
  );
