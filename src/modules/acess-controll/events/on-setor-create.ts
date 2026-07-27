import { FastifyBaseLogger } from "fastify";
import { EventSubscriber } from "../../../core/event/event-contracts.js";
import { SetorEventMap, SETOR_EVENTS } from "../../setor/application/events/setor.events.js";
import { ServiceAccessDefaultsUseCase } from "../application/service-access-defaults.usecase.js";

export const registerSetorCreatedHandler = (
  setorEvents: EventSubscriber<SetorEventMap>,
  serviceAccessDefaults: ServiceAccessDefaultsUseCase,
  logger: Pick<FastifyBaseLogger, "error">,
) =>
  setorEvents.subscribe(SETOR_EVENTS.created, async (event) => {
    try {
      await serviceAccessDefaults.ensureForSetor(event.setor);
    } catch (error) {
      logger.error(
        { err: error, setorId: event.setor.id },
        "Unable to create default access for setor",
      );
    }
  });

