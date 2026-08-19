import { AuditEventBase } from "../../domain/entity/AuditEvent.js";

export type AuditQueryDto = {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  userId?: number;
  setorId?: number;
  module?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  result?: string;
  requestId?: string;
};

export interface RecordAuditDto extends AuditEventBase {
  eventId?: string;
  occurredAt?: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
}

export interface AuditOutboxItemDto {
  id: string | number;
  eventId: string;
  payload: string;
  attempts: number;
}
