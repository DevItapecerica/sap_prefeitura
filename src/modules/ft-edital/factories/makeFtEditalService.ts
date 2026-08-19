import { SequelizeFtEditalRepository } from "../../../infra/database/sequelize/repositories/sequelize.ft-edital.repository.js";
import { FtEditalService } from "../application/use-case/ft-edital.service.js";

export const makeFtEditalService = () => {
  const repository = new SequelizeFtEditalRepository();
  return new FtEditalService(repository);
};
