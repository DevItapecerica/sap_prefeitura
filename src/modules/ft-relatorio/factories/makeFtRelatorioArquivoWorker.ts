import { LocalReportArchiveStorage } from "../../../infra/files/local-report-archive.storage.js";
import { FT_REPORT_ARCHIVE_DIR } from "../../../core/env.js";
import { SequelizeFtRelatorioArquivoRepository } from "../../../infra/database/sequelize/repositories/sequelize.ft-relatorio-arquivo.repository.js";
import { SequelizeFtRelatorioRepository } from "../../../infra/database/sequelize/repositories/sequelize.ft-relatorio.repository.js";
import { makeGerarEspelhoPontoBolsista } from "../../ft-bolsista/factories/makeGerarEspelhoPontoBolsista.js";
import { makeGerarFolhaPresencaBolsista } from "../../ft-bolsista/factories/makeGerarFolhaPresencaBolsista.js";
import { FtRelatorioArquivoWorkerService } from "../application/use-case/ft-relatorio-arquivo-worker.service.js";
import { makeHoleritesLoteService } from "./makeHoleritesLoteService.js";

export const makeFtRelatorioArquivoWorker = () =>
  new FtRelatorioArquivoWorkerService(
    new SequelizeFtRelatorioArquivoRepository(),
    new SequelizeFtRelatorioRepository(),
    makeGerarEspelhoPontoBolsista(),
    new LocalReportArchiveStorage(FT_REPORT_ARCHIVE_DIR),
    makeGerarFolhaPresencaBolsista(),
    undefined,
    makeHoleritesLoteService(),
  );
