import { AuditAction, AuditResult } from "../../domain/entity/AuditEvent.js";

export type AuditQueryDto = {
  page?: number; limit?: number; from?: string; to?: string; userId?: number;
  setorId?: number; module?: string; action?: string; resourceType?: string;
  resourceId?: string; result?: string; requestId?: string;
};

export interface AuditActorDto {
  userId?: number | string | null;
  roleId?: number | string | null;
  setorId?: number | string | null;
  name?: string | null;
}

export interface RecordAuditDto {
  eventId?: string;
  occurredAt?: string;
  actor: AuditActorDto;
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
