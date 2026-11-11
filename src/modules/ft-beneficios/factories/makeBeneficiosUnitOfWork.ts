import { SequelizeBeneficiosUnitOfWork } from "../../../infra/database/sequelize/repositories/sequelize.beneficios.repository.js";
import { makeAuditService } from "../../audit/factories/makeAuditService.js";

export const makeBeneficiosUnitOfWork = () =>
  new SequelizeBeneficiosUnitOfWork(makeAuditService);
