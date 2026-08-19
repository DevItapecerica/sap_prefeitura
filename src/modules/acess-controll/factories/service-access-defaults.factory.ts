import { SequelizePermissionRepository } from "../../../infra/database/sequelize/repositories/sequelize.permission.repository.js";
import { SequelizeRolesRepository } from "../../../infra/database/sequelize/repositories/sequelize.roles.repository.js";
import { SequelizeServicesRepository } from "../../../infra/database/sequelize/repositories/sequelize.services.repository.js";
import { SequelizeServiceVisibilityRepository } from "../../../infra/database/sequelize/repositories/sequelize.servicesVisibility.repository.js";
import { SequelizeSetorRepository } from "../../../infra/database/sequelize/repositories/sequelize.setor.repository.js";
import { ServiceAccessDefaultsUseCase } from "../application/service-access-defaults.usecase.js";

export const makeServiceAccessDefaults = () =>
  new ServiceAccessDefaultsUseCase(
    new SequelizeServicesRepository(),
    new SequelizeServiceVisibilityRepository(),
    new SequelizeRolesRepository(),
    new SequelizePermissionRepository(),
    new SequelizeSetorRepository(),
  );
