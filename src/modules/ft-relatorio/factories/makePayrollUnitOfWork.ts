import db from "../../../infra/database/sequelize/index.js";
import AesCryptService from "../../../core/security/aes/AesCrypt.service.js";
import { SequelizePayrollUnitOfWork } from "../../../infra/database/sequelize/repositories/sequelize.payroll-unit-of-work.js";
import { SequelizeFtRelatorioRepository } from "../../../infra/database/sequelize/repositories/sequelize.ft-relatorio.repository.js";
import { GerarRelatorioFtUseCase } from "../application/use-case/gerar-relatorio-ft.use-case.js";
import { makeAuditService } from "../../audit/factories/makeAuditService.js";

export const makePayrollUnitOfWork = () =>
  new SequelizePayrollUnitOfWork(
    db,
    (id, query, transaction) =>
      new GerarRelatorioFtUseCase(
        new SequelizeFtRelatorioRepository(transaction),
      ).calculate(id, query),
    new AesCryptService(),
    makeAuditService,
  );
