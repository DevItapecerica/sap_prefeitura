import { ApplicationEventContext } from "./application-event.js";
import { AuditableAction } from "./auditable-action.js";

export const HTTP_REQUEST_FAILED_EVENT = "HTTP_REQUEST_FAILED" as const;

export interface HttpRequestFailedEvent {
  context: ApplicationEventContext;
  action: AuditableAction;
  module: string;
  resourceType: string;
  resourceId?: string;
  statusCode: number;
  errorCode: string;
  filters?: unknown;
  requestedChanges?: unknown;
  attemptedIdentity?: string;
}

export interface HttpRequestFailedEventMap {
  [HTTP_REQUEST_FAILED_EVENT]: HttpRequestFailedEvent;
}
