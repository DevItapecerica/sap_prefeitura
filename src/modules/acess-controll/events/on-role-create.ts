import { FastifyBaseLogger } from "fastify";
import { RoleEventSubscriber } from "../../roles/application/events/role-event-bus.js";
import { ServiceAccessDefaultsUseCase } from "../application/service-access-defaults.usecase.js";

export const registerRoleCreatedHandler = (
  roleEvents: RoleEventSubscriber,
  serviceAccessDefaults: ServiceAccessDefaultsUseCase,
  logger: Pick<FastifyBaseLogger, "error">,
) =>
  roleEvents.onCreated(async (event) => {
    try {
      await serviceAccessDefaults.ensureForRole(event.role);
    } catch (error) {
      logger.error(
        { err: error, roleId: event.role.id },
        "Unable to create default access for role",
      );
    }
  });
