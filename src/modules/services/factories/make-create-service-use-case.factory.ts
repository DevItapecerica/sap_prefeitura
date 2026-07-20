import { SequelizeServicesRepository } from "../../../infra/database/sequelize/repositories/sequelize.services.repository.js";
import { CreateServiceUseCase } from "../application/use-case/create-service.use-case.js";

export const makeCreateServiceUseCase = () =>
  new CreateServiceUseCase(new SequelizeServicesRepository());
