import { FastifyPluginAsync } from "fastify";
import { registerServiceCreatedHandler } from "./on-service-create.js";
import { registerSetorCreatedHandler } from "./on-setor-create.js";
import { registerRoleCreatedHandler } from "./on-role-create.js";
import { makeServiceAccessDefaults } from "../factories/service-access-defaults.factory.js";
import { makeSetorEventSubscriber } from "../../setor/factories/make-setor-event-subscriber.factory.js";
import { makeServiceEventSubscriber } from "../../services/factories/make-service-event-subscriber.factory.js";


export const registerAccessControlEvents: FastifyPluginAsync = async function (fastify) {
  fastify.log.info("Registering access control events");
  const serviceAccessDefaults = makeServiceAccessDefaults();

  const unregisterServiceCreatedHandler = registerServiceCreatedHandler(
    makeServiceEventSubscriber(),
    serviceAccessDefaults,
  );
  const unregisterSetorCreatedHandler = registerSetorCreatedHandler(
    makeSetorEventSubscriber(),
    serviceAccessDefaults,
  );
  registerRoleCreatedHandler(serviceAccessDefaults);
  fastify.addHook("onClose", async () => {
    unregisterSetorCreatedHandler();
    unregisterServiceCreatedHandler();
  });
}
