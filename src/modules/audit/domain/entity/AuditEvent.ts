import type { AuditableAction } from "../../../../core/event/auditable-action.js";

export {
  AUDITABLE_ACTIONS as AUDIT_ACTIONS,
} from "../../../../core/event/auditable-action.js";
export type AuditAction = AuditableAction;
export type AuditResult = "SUCCESS" | "FAILURE" | "DENIED";

export interface AuditActor {
  userId?: number | string | null;
  roleId?: number | string | null;
  setorId?: number | string | null;
  name?: string | null;
}

export interface AuditEventBase {
  actor: AuditActor;
  action: AuditAction;
  module: string;
  resourceType: string;
  resourceId?: string | null;
  result: AuditResult;
  errorCode?: string | null;
  requestId?: string | null;
  ip?: string | null;
  method?: string | null;
  route?: string | null;
  filters?: unknown;
  returnedCount?: number | null;
}

export interface StoredAuditEvent extends AuditEventBase {
  eventId: string;
  occurredAt: string;
  beforeEncrypted?: string | null;
  afterEncrypted?: string | null;
  metadataEncrypted?: string | null;
}
