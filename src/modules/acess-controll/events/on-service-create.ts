import { eventBus } from "../../../core/event/index.js";
import { ServiceAccessDefaultsUseCase } from "../application/service-access-defaults.usecase.js";
import { Services } from "../../services/domain/entity/Services.js";

export const registerServiceCreatedHandler = (
  serviceAccessDefaults: ServiceAccessDefaultsUseCase,
) => {
  eventBus.on("SERVICE_CREATED", async (service: Services) => {
    await serviceAccessDefaults.ensureForService(service.id);
  });
};

