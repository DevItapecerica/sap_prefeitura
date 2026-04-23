import { SequelizeSetorRepository } from "../../../infra/database/sequelize/repositories/sequelize.setor.repository.js";
import { SetorService } from "../application/use-case/setor.service.js";

const setorFactory = (logger: any): SetorService => {
  const setorRepository = new SequelizeSetorRepository();
  const setorService = new SetorService(setorRepository, logger);
  return setorService;
};

export default setorFactory;