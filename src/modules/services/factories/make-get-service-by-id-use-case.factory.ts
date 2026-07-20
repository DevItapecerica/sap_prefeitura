import { SequelizePermissionRepository } from "../../../infra/database/sequelize/repositories/sequelize.permission.repository.js";
import { SequelizeServicesRepository } from "../../../infra/database/sequelize/repositories/sequelize.services.repository.js";
import { SequelizeServiceVisibilityRepository } from "../../../infra/database/sequelize/repositories/sequelize.servicesVisibility.repository.js";
import { GetServiceByIdUseCase } from "../application/use-case/get-service-by-id.use-case.js";

export const makeGetServiceByIdUseCase = () =>
  new GetServiceByIdUseCase(
    new SequelizeServicesRepository(),
    new SequelizeServiceVisibilityRepository(),
    new SequelizePermissionRepository(),
  );
