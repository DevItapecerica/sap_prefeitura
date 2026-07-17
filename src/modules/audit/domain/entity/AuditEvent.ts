export const AUDIT_ACTIONS = [
  "VIEW", "LIST", "CREATE", "UPDATE", "DELETE", "EXPORT",
  "LOGIN", "LOGOUT", "LOGIN_FAILED", "ACCESS_DENIED", "PASSWORD_CHANGED",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];
export type AuditResult = "SUCCESS" | "FAILURE" | "DENIED";

export interface StoredAuditEvent {
  eventId: string;
  occurredAt: string;
  actor: {
    userId?: number | string | null;
    roleId?: number | string | null;
    setorId?: number | string | null;
    name?: string | null;
  };
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
  beforeEncrypted?: string | null;
  afterEncrypted?: string | null;
  metadataEncrypted?: string | null;
}
