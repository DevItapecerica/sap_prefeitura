import { SequelizePermissionRepository } from "../../../infra/database/sequelize/repositories/sequelize.permission.repository.js";
import PermissionService from "../application/use-case/permission.service.js";

export function makePermission(logger: any): PermissionService {
  return new PermissionService(
    new SequelizePermissionRepository(),
    logger,
  );
}

