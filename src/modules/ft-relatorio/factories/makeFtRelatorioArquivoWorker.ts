import { SequelizeFtRelatorioArquivoRepository } from "../../../infra/database/sequelize/repositories/sequelize.ft-relatorio-arquivo.repository.js";
import { SequelizeFtRelatorioRepository } from "../../../infra/database/sequelize/repositories/sequelize.ft-relatorio.repository.js";
import { makeGerarEspelhoPontoBolsista } from "../../ft-bolsista/factories/makeGerarEspelhoPontoBolsista.js";
import { FtRelatorioArquivoWorkerService } from "../application/use-case/ft-relatorio-arquivo-worker.service.js";

export const makeFtRelatorioArquivoWorker = () => new FtRelatorioArquivoWorkerService(new SequelizeFtRelatorioArquivoRepository(), new SequelizeFtRelatorioRepository(), makeGerarEspelhoPontoBolsista());
