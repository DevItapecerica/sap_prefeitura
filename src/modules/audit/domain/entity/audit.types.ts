export type AuditQuery = {
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

export interface AuditOutboxItem {
  id: string | number;
  eventId: string;
  payload: string;
  attempts: number;
}
