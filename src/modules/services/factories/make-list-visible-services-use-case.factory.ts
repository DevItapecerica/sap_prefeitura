import { SequelizePermissionRepository } from "../../../infra/database/sequelize/repositories/sequelize.permission.repository.js";
import { SequelizeServicesRepository } from "../../../infra/database/sequelize/repositories/sequelize.services.repository.js";
import { SequelizeServiceVisibilityRepository } from "../../../infra/database/sequelize/repositories/sequelize.servicesVisibility.repository.js";
import { ListVisibleServicesUseCase } from "../application/use-case/list-visible-services.use-case.js";
import { ServicesVisiblesService } from "../domain/services/services-visibles.service.js";

export const makeListVisibleServicesUseCase = () =>
  new ListVisibleServicesUseCase(
    new SequelizeServicesRepository(),
    new SequelizeServiceVisibilityRepository(),
    new SequelizePermissionRepository(),
    new ServicesVisiblesService(),
  );
