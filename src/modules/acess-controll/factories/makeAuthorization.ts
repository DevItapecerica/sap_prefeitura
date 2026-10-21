import { SequelizeActionPermissionRepository } from "../../../infra/database/sequelize/repositories/sequelize.action-permission.repository.js";
import { AuthorizationUseCase } from "../application/authorization.usecase.js";
export const authorizationFactory = (_logger?: unknown) => new AuthorizationUseCase(new SequelizeActionPermissionRepository());
