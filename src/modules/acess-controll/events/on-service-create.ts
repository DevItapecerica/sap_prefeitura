import { FastifyBaseLogger } from "fastify";
import { ServiceEventSubscriber } from "../../services/application/events/service-event-bus.js";
import { ServiceAccessDefaultsUseCase } from "../application/service-access-defaults.usecase.js";

export const registerServiceCreatedHandler = (
  serviceEvents: ServiceEventSubscriber,
  serviceAccessDefaults: ServiceAccessDefaultsUseCase,
  logger: Pick<FastifyBaseLogger, "error">,
) =>
  serviceEvents.onCreated(async (event) => {
    try {
      await serviceAccessDefaults.ensureForService(event.service.id);
    } catch (error) {
      logger.error(
        { err: error, serviceId: event.service.id },
        "Unable to create default access for service",
      );
    }
  });

