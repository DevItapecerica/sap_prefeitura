import AesCryptService from "../../../core/security/aes/AesCrypt.service.js";
import { SequelizeAuditRepository } from "../../../infra/database/sequelize/repositories/sequelize.audit.repository.js";
import { AuditMapper } from "../application/mapper/audit.mapper.js";
import { AuditService } from "../application/use-case/audit.service.js";
import type { Transaction } from "sequelize";
import { EventBusAdapter } from "../../../infra/event/event-bus.adapter.js";

export const makeAuditService = (transaction?: Transaction) =>
  new AuditService(
    new SequelizeAuditRepository(transaction),
    new AuditMapper(new AesCryptService()),
    new EventBusAdapter<{ AUDIT_OUTBOX_AVAILABLE: { eventId: string } }>(),
  );
