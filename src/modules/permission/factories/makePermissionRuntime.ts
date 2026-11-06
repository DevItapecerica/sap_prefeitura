import { SequelizeActionPermissionRepository } from "../../../infra/database/sequelize/repositories/sequelize.action-permission.repository.js";
import type { ActionPermissionRuntime } from "../application/use-case/action-permissions.js";

export const makePermissionRuntime = (): ActionPermissionRuntime =>
  new SequelizeActionPermissionRepository();
