import { SequelizeFtBolsistaRepository } from "../../../infra/database/sequelize/repositories/sequelize.ft-bolsista.repository.js";
import { FtBolsistaService } from "../application/use-case/ft-bolsista.service.js";

export const makeFtBolsistaService = () => {
  const repository = new SequelizeFtBolsistaRepository();
  return new FtBolsistaService(repository);
};
