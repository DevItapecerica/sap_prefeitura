import { LocalReportArchiveStorage } from "../../../infra/files/local-report-archive.storage.js";
import { FT_REPORT_ARCHIVE_DIR } from "../../../core/env.js";
import { EventBusAdapter } from "../../../infra/event/event-bus.adapter.js";
import type { ReportBatchEvents } from "../application/ports/report-archive.storage.js";
import { SequelizeFtRelatorioArquivoRepository } from "../../../infra/database/sequelize/repositories/sequelize.ft-relatorio-arquivo.repository.js";
import { SequelizeFtRelatorioRepository } from "../../../infra/database/sequelize/repositories/sequelize.ft-relatorio.repository.js";
import { FtRelatorioArquivoService } from "../application/use-case/ft-relatorio-arquivo.service.js";

export const makeFtRelatorioArquivoService = () =>
  new FtRelatorioArquivoService(
    new SequelizeFtRelatorioArquivoRepository(),
    new SequelizeFtRelatorioRepository(),
    new LocalReportArchiveStorage(FT_REPORT_ARCHIVE_DIR),
    new EventBusAdapter<ReportBatchEvents>(),
  );
