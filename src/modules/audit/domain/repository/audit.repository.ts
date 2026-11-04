import { AuditOutboxItem, AuditQuery } from "../entity/audit.types.js";
import { StoredAuditEvent } from "../entity/AuditEvent.js";

export default interface AuditRepository {
  enqueue(event: StoredAuditEvent): Promise<void>;
  claimBatch(
    now: Date,
    staleBefore: Date,
    limit?: number,
  ): Promise<AuditOutboxItem[]>;
  persist(item: AuditOutboxItem): Promise<void>;
  markFailed(
    item: AuditOutboxItem,
    error: unknown,
    nextAttemptAt: Date,
  ): Promise<void>;
  backlog(): Promise<number>;
  list(
    query: AuditQuery,
  ): Promise<{ rows: Record<string, unknown>[]; count: number }>;
  detail(id: string): Promise<Record<string, unknown> | null>;
  export(query: AuditQuery): Promise<Record<string, unknown>[]>;
  purge(before: Date): Promise<number>;
}
