import { SequelizePermissionRepository } from "../../../infra/database/sequelize/repositories/sequelize.permission.repository.js";
import { SequelizeServicesRepository } from "../../../infra/database/sequelize/repositories/sequelize.services.repository.js";
import { SequelizeServiceVisibilityRepository } from "../../../infra/database/sequelize/repositories/sequelize.servicesVisibility.repository.js";
import { DeleteServiceUseCase } from "../application/use-case/delete-service.use-case.js";

export const makeDeleteServiceUseCase = () =>
  new DeleteServiceUseCase(
    new SequelizeServicesRepository(),
    new SequelizeServiceVisibilityRepository(),
    new SequelizePermissionRepository(),
  );
