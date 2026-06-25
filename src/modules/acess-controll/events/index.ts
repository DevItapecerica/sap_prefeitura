import { FastifyPluginAsync } from "fastify";
import { registerServiceCreatedHandler } from "./on-service-create.js";
import { registerSetorCreatedHandler } from "./on-setor-create.js";
import { registerRoleCreatedHandler } from "./on-role-create.js";
import { makeServiceAccessDefaults } from "../factories/service-access-defaults.factory.js";


export const registerAccessControlEvents: FastifyPluginAsync = async function (fastify) {
  fastify.log.info("Registering access control events");
  const serviceAccessDefaults = makeServiceAccessDefaults();

  registerServiceCreatedHandler(serviceAccessDefaults);
  registerSetorCreatedHandler(serviceAccessDefaults);
  registerRoleCreatedHandler(serviceAccessDefaults);
}
