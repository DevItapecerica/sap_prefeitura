import { FastifyBaseLogger } from "fastify";
import { eventBus } from "../../../core/event/index.js";
import { makeAuditWorkerService } from "../factories/makeAuditWorkerService.js";

let pollingTimer: NodeJS.Timeout | null = null;
let retentionTimer: NodeJS.Timeout | null = null;
let running = false;
const POLLING_INTERVAL_MS = 5_000;
const RETENTION_INTERVAL_MS = 24 * 60 * 60_000;

export const runAuditWorkerTask = async (logger: FastifyBaseLogger, now = new Date()) => {
  if (running) return;
  running = true;
  try {
    const result = await makeAuditWorkerService().run(now);
    if (result.backlog > 0) logger.warn({ backlog: result.backlog }, "Audit outbox backlog");
    if (result.failed > 0) logger.error({ failed: result.failed }, "Audit events failed");
  } catch (error) { logger.error({ err: error }, "Audit worker failed"); }
  finally { running = false; }
};

export const runAuditRetentionTask = async (logger: FastifyBaseLogger, now = new Date()) => {
  try {
    const deleted = await makeAuditWorkerService().purge(now, 5);
    if (deleted > 0) logger.info({ deleted }, "Expired audit logs purged");
  } catch (error) { logger.error({ err: error }, "Audit retention purge failed"); }
};

export const startAuditWorker = (logger: FastifyBaseLogger) => {
  const wakeHandler = () => { void runAuditWorkerTask(logger); };
  eventBus.on("AUDIT_OUTBOX_AVAILABLE", wakeHandler);
  pollingTimer = setInterval(() => void runAuditWorkerTask(logger), POLLING_INTERVAL_MS);
  retentionTimer = setInterval(() => void runAuditRetentionTask(logger), RETENTION_INTERVAL_MS);
  pollingTimer.unref(); retentionTimer.unref();
  void runAuditWorkerTask(logger); void runAuditRetentionTask(logger);
  return { stop: () => {
    eventBus.off("AUDIT_OUTBOX_AVAILABLE", wakeHandler);
    if (pollingTimer) clearInterval(pollingTimer);
    if (retentionTimer) clearInterval(retentionTimer);
    pollingTimer = null; retentionTimer = null;
  } };
};

export const __testing = { POLLING_INTERVAL_MS, RETENTION_INTERVAL_MS };
