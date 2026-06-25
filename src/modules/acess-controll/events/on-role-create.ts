import { eventBus } from "../../../core/event/index.js";
import { Roles } from "../../roles/domain/entity/Role.js";
import { ServiceAccessDefaultsUseCase } from "../application/service-access-defaults.usecase.js";

export const registerRoleCreatedHandler = (
  serviceAccessDefaults: ServiceAccessDefaultsUseCase,
) => {
  eventBus.on("ROLE_CREATED", async (role: Roles) => {
    await serviceAccessDefaults.ensureForRole(role);
  });
};
