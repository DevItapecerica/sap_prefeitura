import { FastifyPluginAsync } from "fastify";
import { registerServiceCreatedHandler } from "./on-service-create.js";
import { registerSetorCreatedHandler } from "./on-setor-create.js";
import { registerRoleCreatedHandler } from "./on-role-create.js";
import { makeServiceAccessDefaults } from "../factories/service-access-defaults.factory.js";
import { makeSetorEventSubscriber } from "../../setor/factories/setor.factories.js";
import { makeServiceEventSubscriber } from "../../services/factories/service.factories.js";
import { makeRoleEventSubscriber } from "../../roles/factories/role.factories.js";
export const registerAccessControlEvents: FastifyPluginAsync = async function (
  fastify,
) {
  fastify.log.info("Registering access control events");
  const serviceAccessDefaults = makeServiceAccessDefaults();

  const unregisterServiceCreatedHandler = registerServiceCreatedHandler(
    makeServiceEventSubscriber(),
    serviceAccessDefaults,
    fastify.log,
  );
  const unregisterSetorCreatedHandler = registerSetorCreatedHandler(
    makeSetorEventSubscriber(),
    serviceAccessDefaults,
    fastify.log,
  );
  const unregisterRoleCreatedHandler = registerRoleCreatedHandler(
    makeRoleEventSubscriber(),
    serviceAccessDefaults,
    fastify.log,
  );
  try {
    await serviceAccessDefaults.reconcile();
  } catch (error) {
    fastify.log.error(
      { err: error },
      "Unable to reconcile default service access",
    );
  }
  fastify.addHook("onClose", async () => {
    unregisterSetorCreatedHandler();
    unregisterServiceCreatedHandler();
    unregisterRoleCreatedHandler();
  });
};
