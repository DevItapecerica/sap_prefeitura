import type { AuditEventBase } from "./AuditEvent.js";

export interface AuditCommand extends AuditEventBase {
  eventId?: string;
  occurredAt?: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
}
