import { SequelizeRolesRepository } from "../../../infra/database/sequelize/repositories/sequelize.roles.repository.js";
import { makePermission } from "../../permission/factories/makeRoles.js";
import RolesService from "../application/use-case/roles.use-case.js";

export function makeRoles(logger: any): RolesService {
  return new RolesService(
    new SequelizeRolesRepository(),
    makePermission(logger),
    logger,
  );
}

