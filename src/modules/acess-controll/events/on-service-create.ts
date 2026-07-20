import { ServiceEventSubscriber } from "../../services/application/events/service-event-subscriber.js";
import { ServiceAccessDefaultsUseCase } from "../application/service-access-defaults.usecase.js";

export const registerServiceCreatedHandler = (
  serviceEvents: ServiceEventSubscriber,
  serviceAccessDefaults: ServiceAccessDefaultsUseCase,
) =>
  serviceEvents.onCreated(async (event) => {
    await serviceAccessDefaults.ensureForService(event.service.id);
  });

