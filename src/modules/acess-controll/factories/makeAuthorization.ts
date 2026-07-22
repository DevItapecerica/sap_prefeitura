import { SequelizePermissionRepository } from "../../../infra/database/sequelize/repositories/sequelize.permission.repository.js";
import { SequelizeRolesRepository } from "../../../infra/database/sequelize/repositories/sequelize.roles.repository.js";
import { SequelizeServicesRepository } from "../../../infra/database/sequelize/repositories/sequelize.services.repository.js";
import { SequelizeServiceVisibilityRepository } from "../../../infra/database/sequelize/repositories/sequelize.servicesVisibility.repository.js";
import { SequelizeUserRepository } from "../../../infra/database/sequelize/repositories/sequelize.user.repository.js";
import { AuthorizationUseCase } from "../application/authorization.usecase.js";

export const authorizationFactory = (logger: any) => {
  const serviceRepo = new SequelizeServicesRepository();
  const serviceVisibilityRepository =
    new SequelizeServiceVisibilityRepository();
  const rolesRepo = new SequelizeRolesRepository();
  const permissionRepo = new SequelizePermissionRepository();
  const userRepo = new SequelizeUserRepository();

  return new AuthorizationUseCase(
    serviceRepo,
    serviceVisibilityRepository,
    rolesRepo,
    permissionRepo,
    userRepo,
    logger,
  );
};
