import { SequelizeFtSchedulerRepository } from "../../../infra/database/sequelize/repositories/sequelize.ft-scheduler.repository.js";
import { FtSchedulerService } from "../application/use-case/ft-scheduler.service.js";
import { makeFtEditalEventPublisher } from "./ft-edital-events.factory.js";

export const makeFtSchedulerService = () =>
  new FtSchedulerService(
    new SequelizeFtSchedulerRepository(),
    makeFtEditalEventPublisher(),
  );
