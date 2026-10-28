import db from '../../../infra/database/sequelize/index.js';
import { SequelizeFtRelatorioRepository } from '../../../infra/database/sequelize/repositories/sequelize.ft-relatorio.repository.js';
import { makeAuditService } from '../../audit/factories/makeAuditService.js';
import { GerarRelatorioFtUseCase } from '../application/use-case/gerar-relatorio-ft.use-case.js';
import { FtFechamentoFolhaService } from '../application/use-case/ft-fechamento-folha.service.js';

export const makeFtFechamentoFolhaService = () => new FtFechamentoFolhaService(db,
  (id, query, transaction) => new GerarRelatorioFtUseCase(new SequelizeFtRelatorioRepository(transaction)).calculate(id, query), makeAuditService());
