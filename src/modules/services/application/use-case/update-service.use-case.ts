import AppError from "../../../../core/appError.js";
import { PermissionRepository } from "../../../permission/domain/repository/permission.repository.js";
import { ServiceVisibilityRepository } from "../../domain/repository/service-visibility.repository.js";
import { ServicesRepository } from "../../domain/repository/services.repository.js";
import { ServicePermissionDto } from "../dto/service-permission.dto.js";
import { ServiceVisibilityDto } from "../dto/service-visibility.dto.js";
import { UpdateServiceDto } from "../dto/update-service.dto.js";
import { UpdateServiceResultDto } from "../dto/update-service-result.dto.js";
import { loadServiceAggregate } from "../utils/load-service-aggregate.js";

export class UpdateServiceUseCase {
  constructor(
    private readonly servicesRepository: ServicesRepository,
    private readonly visibilityRepository: ServiceVisibilityRepository,
    private readonly permissionRepository: PermissionRepository,
  ) {}

  async execute(
    id: number,
    service: UpdateServiceDto,
    permissions: ServicePermissionDto[] = [],
    visibility: ServiceVisibilityDto[] = [],
  ): Promise<UpdateServiceResultDto> {
    const before = await loadServiceAggregate(
      id,
      this.servicesRepository,
      this.visibilityRepository,
      this.permissionRepository,
    );

    this.validatePermissions(id, permissions, before.permissions);
    this.validateVisibility(id, visibility, before.visibility);

    const updatedService = await this.servicesRepository.updateServices(id, {
      ...service,
      tag: service.tag ?? before.services.tag,
    });
    if (!updatedService) {
      throw new AppError("Service not found", 404, "SERVICE_NOT_FOUND");
    }

    for (const permission of permissions) {
      await this.permissionRepository.updatePermissions(permission.id, {
        read: permission.read,
        write: permission.write,
        edit: permission.edit,
        del: permission.del,
      });
    }

    for (const item of visibility) {
      const updated = await this.visibilityRepository.updateServiceVisibility(
        item.id,
        item.visibility,
      );
      if (!updated) {
        throw new AppError(
          "Visibility not found",
          404,
          "VISIBILITY_NOT_FOUND",
        );
      }
    }

    const after = await loadServiceAggregate(
      id,
      this.servicesRepository,
      this.visibilityRepository,
      this.permissionRepository,
    );
    return { before, after };
  }

  private validatePermissions(
    serviceId: number,
    requested: ServicePermissionDto[],
    existing: Array<{ id?: number; service_id: number }>,
  ): void {
    const existingById = new Map(existing.map((item) => [item.id, item]));
    const requestedIds = new Set<number>();

    for (const permission of requested) {
      const stored = existingById.get(permission.id);
      if (
        requestedIds.has(permission.id) ||
        !stored ||
        stored.service_id !== serviceId ||
        permission.service_id !== serviceId
      ) {
        throw new AppError(
          "Permission not found",
          404,
          "PERMISSION_NOT_FOUND",
        );
      }
      requestedIds.add(permission.id);
    }
  }

  private validateVisibility(
    serviceId: number,
    requested: ServiceVisibilityDto[],
    existing: Array<{
      id?: number;
      service_id: number;
      setor_id: number;
    }>,
  ): void {
    const existingById = new Map(existing.map((item) => [item.id, item]));
    const requestedIds = new Set<number>();

    for (const visibility of requested) {
      const stored = existingById.get(visibility.id);
      if (
        requestedIds.has(visibility.id) ||
        !stored ||
        stored.service_id !== serviceId ||
        stored.setor_id !== visibility.setor_id ||
        visibility.service_id !== serviceId
      ) {
        throw new AppError(
          "Visibility not found",
          404,
          "VISIBILITY_NOT_FOUND",
        );
      }
      requestedIds.add(visibility.id);
    }
  }
}
