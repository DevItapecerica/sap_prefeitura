import { FastifyBaseLogger } from "fastify";
import { EventSubscriber } from "../../../core/event/event-contracts.js";
import { RoleEventMap, ROLE_EVENTS } from "../../roles/application/events/role.events.js";
import { ServiceAccessDefaultsUseCase } from "../application/service-access-defaults.usecase.js";

export const registerRoleCreatedHandler = (
  roleEvents: EventSubscriber<RoleEventMap>,
  serviceAccessDefaults: ServiceAccessDefaultsUseCase,
  logger: Pick<FastifyBaseLogger, "error">,
) =>
  roleEvents.subscribe(ROLE_EVENTS.created, async (event) => {
    try {
      await serviceAccessDefaults.ensureForRole(event.role);
    } catch (error) {
      logger.error(
        { err: error, roleId: event.role.id },
        "Unable to create default access for role",
      );
    }
  });
