import { SequelizePermissionRepository } from "../../../infra/database/sequelize/repositories/sequelize.permission.repository.js";
import { SequelizeServicesRepository } from "../../../infra/database/sequelize/repositories/sequelize.services.repository.js";
import { SequelizeServiceVisibilityRepository } from "../../../infra/database/sequelize/repositories/sequelize.servicesVisibility.repository.js";
import { UpdateServiceUseCase } from "../application/use-case/update-service.use-case.js";

export const makeUpdateServiceUseCase = () =>
  new UpdateServiceUseCase(
    new SequelizeServicesRepository(),
    new SequelizeServiceVisibilityRepository(),
    new SequelizePermissionRepository(),
  );
