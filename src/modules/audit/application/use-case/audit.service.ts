import { randomUUID } from "crypto";
import AppError from "../../../../core/appError.js";
import { eventBus } from "../../../../core/event/index.js";
import AuditRepository from "../../domain/repository/audit.repository.js";
import { AuditQueryDto, RecordAuditDto } from "../dto/audit.dto.js";
import { AuditMapper } from "../mapper/audit.mapper.js";

export class AuditService {
  constructor(private repository: AuditRepository, private mapper: AuditMapper) {}

  async record(input: RecordAuditDto, transaction?: unknown): Promise<string> {
    const eventId = input.eventId ?? randomUUID();
    const event = await this.mapper.toPersistence({ ...input, eventId, occurredAt: input.occurredAt ?? new Date().toISOString() });
    await this.repository.enqueue(event, transaction);
    await eventBus.emit("AUDIT_OUTBOX_AVAILABLE", { eventId });
    return eventId;
  }

  list(query: AuditQueryDto) { return this.repository.list(query); }

  async detail(id: string) {
    const row = await this.repository.detail(id);
    if (!row) throw new AppError("Evento de auditoria nao encontrado", 404, "AUDIT_NOT_FOUND");
    return this.mapper.toDetail(row);
  }

  export(query: AuditQueryDto) { return this.repository.export(query); }
}
