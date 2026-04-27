import { eventBus } from "../../../core/event/index.js";
import PermissionService from "../../permission/application/use-case/permission.service.js";
import { Roles } from "../../roles/domain/entity/Role.js";
import ServicesService from "../../services/application/use-case/services.service.js";

export const registerRoleCreatedHandler = (
  serviceService: ServicesService,
  permissionService: PermissionService,
) => {
  eventBus.on("ROLE_CREATED", async (role: Roles) => {
    const dataService = await serviceService.getAll({});

    dataService.services.map(async (sv) => {
      await permissionService.createPermission({
        service_id: sv.id,
        role_id: role.id,
      });
    });
  });
};
