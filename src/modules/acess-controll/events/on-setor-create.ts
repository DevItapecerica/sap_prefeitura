import { eventBus } from "../../../core/event/index.js";
import { ServiceAccessDefaultsUseCase } from "../application/service-access-defaults.usecase.js";

export const registerSetorCreatedHandler = (
  serviceAccessDefaults: ServiceAccessDefaultsUseCase,
) => {
  eventBus.on("SETOR_CREATED", async (setor) => {
    await serviceAccessDefaults.ensureForSetor(setor);
  });
};

