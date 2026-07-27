import { PermissionRepository } from "../../../permission/domain/repository/permission.repository.js";
import { ServiceVisibilityRepository } from "../../domain/repository/service-visibility.repository.js";
import { ServicesRepository } from "../../domain/repository/services.repository.js";
import { ServicesVisiblesService } from "../../domain/services/services-visibles.service.js";
import { VisibleServiceDto } from "../dto/visible-service.dto.js";

export class ListVisibleServicesUseCase {
  constructor(
    private readonly servicesRepository: ServicesRepository,
    private readonly visibilityRepository: ServiceVisibilityRepository,
    private readonly permissionRepository: PermissionRepository,
    private readonly visiblesService: ServicesVisiblesService,
  ) {}

  async execute(
    setorId: number | string,
    roleId: number | string,
  ): Promise<VisibleServiceDto[]> {
    const [{ services }, visibility, permissions] = await Promise.all([
      this.servicesRepository.getAllServices({ page: 0, order: "id:desc" }),
      this.visibilityRepository.findVisibilityBySetor(setorId),
      this.permissionRepository.findReadableByRole(roleId),
    ]);

    const readableServiceIds = new Set(
      permissions.map((permission) => permission.service_id),
    );

    return this.visiblesService
      .execute(services, visibility)
      .filter((service) => readableServiceIds.has(service.id))
      .map((service) => ({
        ...service,
        permissions: permissions.filter(
          (permission) => permission.service_id === service.id,
        ),
      }));
  }
}
