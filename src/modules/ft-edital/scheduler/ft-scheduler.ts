import { FastifyBaseLogger } from "fastify";
import { SequelizeFtSchedulerRepository } from "../../../infra/database/sequelize/repositories/sequelize.ft-scheduler.repository.js";
import { FtSchedulerService } from "../application/use-case/ft-scheduler.service.js";

let timeout: NodeJS.Timeout | null = null;
let running = false;
let daysWithoutError = 0;

const getDelayUntilNextRun = (now = new Date()) => {
  const nextRun = new Date(now);
  nextRun.setHours(1, 0, 0, 0);

  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  return nextRun.getTime() - now.getTime();
};

export const runFtSchedulerTask = async (logger: FastifyBaseLogger) => {
  if (running) {
    logger.warn("FT scheduler ja esta em execucao; ignorando nova chamada.");
    return;
  }

  running = true;

  try {
    logger.info(`FT scheduler iniciado. Dias sem erros: ${daysWithoutError++}`);

    const service = new FtSchedulerService(new SequelizeFtSchedulerRepository());
    const result = await service.run();

    logger.info({ result }, "FT scheduler finalizado com sucesso.");
  } catch (error) {
    daysWithoutError = 0;
    logger.error({ error }, "Erro ao atualizar editais/vinculos expirados do FT.");
  } finally {
    running = false;
  }
};

export const startFtScheduler = (logger: FastifyBaseLogger) => {
  const scheduleNext = () => {
    timeout = setTimeout(async () => {
      await runFtSchedulerTask(logger);
      scheduleNext();
    }, getDelayUntilNextRun());

    timeout.unref?.();
  };

  scheduleNext();
  logger.info("FT scheduler registrado para executar diariamente as 01:00.");

  return {
    stop: () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
    },
  };
};

export const __testing = {
  getDelayUntilNextRun,
};
