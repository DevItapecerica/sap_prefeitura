import { eventBus } from "../../../core/event/index.js";
import PermissionService from "../../permission/application/use-case/permission.service.js";
import RolesService from "../../roles/application/use-case/roles.use-case.js";
import ServicesService from "../../services/application/use-case/services.service.js";
import { Services } from "../../services/domain/entity/Services.js";
import { SetorService } from "../../setor/application/use-case/setor.service.js";

export const registerServiceCreatedHandler = (
  setorService: SetorService,
  servicesService: ServicesService,
  rolesServuce:RolesService,
  permissionService: PermissionService
) => {
  eventBus.on("SERVICE_CREATED", async (service: Services) => {
    const dataSetor = await setorService.findAllSetor({});
    const dataRoles = await rolesServuce.getAllRoles({});

    dataSetor.map(async (st) => {
      await servicesService.ServiceVisibilityCreate(st.id, service.id);
    });

    dataRoles.roles.map(async (role) => {
      await permissionService.createPermission({service_id: service.id, role_id: role.id});
    });

  });
};

