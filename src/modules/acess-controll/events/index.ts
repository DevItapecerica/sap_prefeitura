import { FastifyPluginAsync } from "fastify";
import { registerServiceCreatedHandler } from "./on-service-create.js";
import { registerSetorCreatedHandler } from "./on-setor-create.js";
import setorFactory from "../../setor/factories/setor.factory.js";
import serviceFactory from "../../services/factories/setor.factory.js";
import { makeRoles } from "../../roles/factories/makeRoles.js";
import { makePermission } from "../../permission/factories/makePermission.js";
import { registerRoleCreatedHandler } from "./on-role-create.js";


export const registerAccessControlEvents: FastifyPluginAsync = async function (fastify) {
  const logger = fastify.log;

  const setorService = setorFactory(logger);
  const serviceService = serviceFactory(logger);
  const rolesService = makeRoles(logger);
  const permissionService = makePermission(logger);

  registerServiceCreatedHandler(setorService, serviceService, rolesService, permissionService);
  registerSetorCreatedHandler(serviceService);
  registerRoleCreatedHandler(serviceService, permissionService);
}