import { SequelizeAuditRepository } from "../../../infra/database/sequelize/repositories/sequelize.audit.repository.js";
import { AuditWorkerService } from "../application/use-case/audit-worker.service.js";

export const makeAuditWorkerService = () =>
  new AuditWorkerService(new SequelizeAuditRepository());
