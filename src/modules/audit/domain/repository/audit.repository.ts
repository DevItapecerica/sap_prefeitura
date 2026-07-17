import {
  AuditOutboxItemDto,
  AuditQueryDto,
} from "../../application/dto/audit.dto.js";
import { StoredAuditEvent } from "../entity/AuditEvent.js";

export default interface AuditRepository {
  enqueue(event: StoredAuditEvent, transaction?: unknown): Promise<void>;
  claimBatch(
    now: Date,
    staleBefore: Date,
    limit?: number,
  ): Promise<AuditOutboxItemDto[]>;
  persist(item: AuditOutboxItemDto): Promise<void>;
  markFailed(
    item: AuditOutboxItemDto,
    error: unknown,
    nextAttemptAt: Date,
  ): Promise<void>;
  backlog(): Promise<number>;
  list(
    query: AuditQueryDto,
  ): Promise<{ rows: Record<string, any>[]; count: number }>;
  detail(id: string): Promise<Record<string, any> | null>;
  export(query: AuditQueryDto): Promise<Record<string, any>[]>;
  purge(before: Date): Promise<number>;
}
