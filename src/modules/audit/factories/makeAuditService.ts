import AesCryptService from "../../../core/security/aes/AesCrypt.service.js";
import { SequelizeAuditRepository } from "../../../infra/database/sequelize/repositories/sequelize.audit.repository.js";
import { AuditMapper } from "../application/mapper/audit.mapper.js";
import { AuditService } from "../application/use-case/audit.service.js";

export const makeAuditService = () => new AuditService(
  new SequelizeAuditRepository(),
  new AuditMapper(new AesCryptService()),
);
