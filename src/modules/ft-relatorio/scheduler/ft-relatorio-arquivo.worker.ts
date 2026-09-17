import { FastifyBaseLogger } from "fastify";
import { eventBus } from "../../../core/event/index.js";
import { makeFtRelatorioArquivoWorker } from "../factories/makeFtRelatorioArquivoWorker.js";

let running = false;
const POLL_MS = 5_000;
const CLEANUP_MS = 24 * 60 * 60_000;

export const runFtReportWorker = async (logger: FastifyBaseLogger) => {
  if (running) return;
  running = true;
  try {
    let result;
    do { result = await makeFtRelatorioArquivoWorker().run(); } while (result.processed > 0 && result.backlog > 0);
  } catch (error) { logger.error({ err: error }, "FT report worker failed"); }
  finally { running = false; }
};

export const startFtReportWorker = (logger: FastifyBaseLogger) => {
  const wake = () => void runFtReportWorker(logger);
  eventBus.on("FT_REPORT_BATCH_AVAILABLE", wake);
  const polling = setInterval(wake, POLL_MS);
  const cleanup = setInterval(() => void makeFtRelatorioArquivoWorker().purge().catch((error) => logger.error({ err: error }, "FT report cleanup failed")), CLEANUP_MS);
  polling.unref(); cleanup.unref(); wake();
  return { stop: () => { eventBus.off("FT_REPORT_BATCH_AVAILABLE", wake); clearInterval(polling); clearInterval(cleanup); } };
};

export const __testing = { POLL_MS, CLEANUP_MS };
