import db from "../../../infra/database/sequelize/index.js";
import { SequelizeEstoqueUnitOfWork } from "../../../infra/database/sequelize/repositories/sequelize.estoque.repository.js";
import { makeAuditService } from "../../audit/factories/makeAuditService.js";
import { EstoqueService } from "../application/estoque.service.js";
import { EstoqueController } from "../interface/controller/estoque.controller.js";
export const makeEstoqueService = () =>
  new EstoqueService(new SequelizeEstoqueUnitOfWork(db, makeAuditService));
export const makeEstoqueController = () =>
  new EstoqueController(makeEstoqueService());
