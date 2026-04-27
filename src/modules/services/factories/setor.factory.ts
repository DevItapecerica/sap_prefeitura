import { SequelizePermissionRepository } from "../../../infra/database/sequelize/repositories/sequelize.permission.repository.js";
import { SequelizeServicesRepository } from "../../../infra/database/sequelize/repositories/sequelize.services.repository.js";
import { SequelizeServiceVisibilityRepository } from "../../../infra/database/sequelize/repositories/sequelize.servicesVisibility.repository.js";
import ServicesService from "../application/use-case/services.service.js";

const serviceFactory = (logger: any): ServicesService => {
  const servicesRepository = new SequelizeServicesRepository();
  const servicesVisibilityRepository = new SequelizeServiceVisibilityRepository();
  const PermissionRepository = new SequelizePermissionRepository();
  const setorService = new ServicesService(servicesRepository, servicesVisibilityRepository, PermissionRepository, logger);
  return setorService;
};

export default serviceFactory;