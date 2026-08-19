import { FastifyBaseLogger } from "fastify";
import { EventSubscriber } from "../../../core/event/event-contracts.js";
import { ServiceEventMap, SERVICE_EVENTS } from "../../services/application/events/service.events.js";
import { ServiceAccessDefaultsUseCase } from "../application/service-access-defaults.usecase.js";

export const registerServiceCreatedHandler = (
  serviceEvents: EventSubscriber<ServiceEventMap>,
  serviceAccessDefaults: ServiceAccessDefaultsUseCase,
  logger: Pick<FastifyBaseLogger, "error">,
) =>
  serviceEvents.subscribe(SERVICE_EVENTS.created, async (event) => {
    try {
      await serviceAccessDefaults.ensureForService(event.service.id);
    } catch (error) {
      logger.error(
        { err: error, serviceId: event.service.id },
        "Unable to create default access for service",
      );
    }
  });

