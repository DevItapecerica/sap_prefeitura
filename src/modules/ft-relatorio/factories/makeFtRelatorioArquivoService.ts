import { SequelizeFtRelatorioArquivoRepository } from "../../../infra/database/sequelize/repositories/sequelize.ft-relatorio-arquivo.repository.js";
import { SequelizeFtRelatorioRepository } from "../../../infra/database/sequelize/repositories/sequelize.ft-relatorio.repository.js";
import { FtRelatorioArquivoService } from "../application/use-case/ft-relatorio-arquivo.service.js";

export const makeFtRelatorioArquivoService = () => new FtRelatorioArquivoService(new SequelizeFtRelatorioArquivoRepository(), new SequelizeFtRelatorioRepository());
