import { FastifyBaseLogger } from "fastify";
import { SetorEventSubscriber } from "../../setor/application/events/setor-event-bus.js";
import { ServiceAccessDefaultsUseCase } from "../application/service-access-defaults.usecase.js";

export const registerSetorCreatedHandler = (
  setorEvents: SetorEventSubscriber,
  serviceAccessDefaults: ServiceAccessDefaultsUseCase,
  logger: Pick<FastifyBaseLogger, "error">,
) =>
  setorEvents.onCreated(async (event) => {
    try {
      await serviceAccessDefaults.ensureForSetor(event.setor);
    } catch (error) {
      logger.error(
        { err: error, setorId: event.setor.id },
        "Unable to create default access for setor",
      );
    }
  });

