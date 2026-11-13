import { FT_REPORT_ARCHIVE_DIR } from "../../../core/env.js";
import { LocalReportArchiveStorage } from "../../../infra/files/local-report-archive.storage.js";
import { SequelizeFtRelatorioArquivoRepository } from "../../../infra/database/sequelize/repositories/sequelize.ft-relatorio-arquivo.repository.js";
import { HoleritesLoteService } from "../application/use-case/holerites-lote.service.js";
import { makeGerarHolerite } from "./makeGerarHolerite.js";

export const makeHoleritesLoteService = () =>
  new HoleritesLoteService(
    makeGerarHolerite(),
    new SequelizeFtRelatorioArquivoRepository(),
    new LocalReportArchiveStorage(FT_REPORT_ARCHIVE_DIR),
  );
