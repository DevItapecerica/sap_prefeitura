import db from "../../infra/database/sequelize/index.js";
import { SequelizeSetorRepository } from "../../infra/database/sequelize/repositories/sequelize.setor.repository.js";
import { SequelizeUserRepository } from "../../infra/database/sequelize/repositories/sequelize.user.repository.js";
import UserService from "../user/user.service.js";
import { SetorService } from "./setor.service.js";

const setorFactory = (logger: any): SetorService => {
  const setorRepository = new SequelizeSetorRepository();
  const userService = new UserService(new SequelizeUserRepository(),logger);
  const setorService = new SetorService(setorRepository, userService, logger);
  return setorService;
};

export default setorFactory;