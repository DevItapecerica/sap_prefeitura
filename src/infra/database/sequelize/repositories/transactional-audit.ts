import type { Transaction } from "sequelize";
import type { AuditService } from "../../../../modules/audit/application/use-case/audit.service.js";

export type ScopedAuditWriter = Pick<AuditService, "record">;
export type TransactionalAuditFactory = (
  transaction: Transaction,
) => ScopedAuditWriter;
