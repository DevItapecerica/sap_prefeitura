import db from "../../../infra/database/sequelize/index.js";
import AesCryptService from "../../../core/security/aes/AesCrypt.service.js";
import { SequelizeWorkflowUnitOfWork } from "../../../infra/database/sequelize/repositories/sequelize.workflow.repository.js";
import { EditalWorkflowService } from "../application/use-case/edital-workflow.service.js";
import { EditalWorkflowController } from "../interface/controller/edital-workflow.controller.js";
import { makeGerarEspelhoPontoBolsista } from "../../ft-bolsista/factories/makeGerarEspelhoPontoBolsista.js";
import { makeGerarFolhaPresencaBolsista } from "../../ft-bolsista/factories/makeGerarFolhaPresencaBolsista.js";
import { makeAuditService } from "../../audit/factories/makeAuditService.js";
export const makeEditalWorkflowService = () =>
  new EditalWorkflowService(
    new SequelizeWorkflowUnitOfWork(db, makeAuditService),
    new AesCryptService(),
  );
export const makeEditalWorkflowController = () =>
  new EditalWorkflowController(
    makeEditalWorkflowService(),
    makeGerarEspelhoPontoBolsista(),
    makeGerarFolhaPresencaBolsista(),
  );
