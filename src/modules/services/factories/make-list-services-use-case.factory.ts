import { SequelizeServicesRepository } from "../../../infra/database/sequelize/repositories/sequelize.services.repository.js";
import { ListServicesUseCase } from "../application/use-case/list-services.use-case.js";

export const makeListServicesUseCase = () =>
  new ListServicesUseCase(new SequelizeServicesRepository());
