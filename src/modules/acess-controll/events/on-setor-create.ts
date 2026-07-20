import { SetorEventSubscriber } from "../../setor/application/events/setor-event-subscriber.js";
import { ServiceAccessDefaultsUseCase } from "../application/service-access-defaults.usecase.js";

export const registerSetorCreatedHandler = (
  setorEvents: SetorEventSubscriber,
  serviceAccessDefaults: ServiceAccessDefaultsUseCase,
) =>
  setorEvents.onCreated(async (event) => {
    await serviceAccessDefaults.ensureForSetor(event.setor);
  });

