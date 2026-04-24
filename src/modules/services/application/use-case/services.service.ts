import AppError from "../../../../core/appError.js";
import { QueryParams } from "../../../../core/shared/types/genericTypes.js";
import {
  CreateServicesDto,
  permissionDto,
  ServicesDto,
  UpdateServicesDto,
  visibilityDto,
} from "../dto/services.dto.js";
import {
  ServicesRepository,
  serviceVisibilityRepository,
} from "../../domain/repository/services.repository.js";
import { Services } from "../../domain/entity/Services.js";
import { ServiceVisibility } from "../../domain/entity/ServiceVisibility.js";
import { eventBus } from "../../../../core/event/index.js";
import { PermissionRepository } from "../../../permission/domain/repository/permission.repository.js";
import { Permissions } from "../../../permission/domain/entity/Permission.js";
import { ServicesVisiblesService } from "../../domain/services/ServicesVisibles.service.js";

export default class ServicesService {
  constructor(
    private repo: ServicesRepository,
    private visibilityRepo: serviceVisibilityRepository,
    private repoPermissions: PermissionRepository,
    private logger: any,
  ) {}
  getAll = async (query: QueryParams) => {
    return await this.repo.getAllServices(query);
  };

  getOne = async (
    id: number,
  ): Promise<{
    services: Services;
    visibility: ServiceVisibility[];
    permissions: Permissions[];
  }> => {
    const service = await this.repo.getOneServices(id);
    const visibility = await this.visibilityRepo.findOneServiceVisibility(id);
    const permissions = await this.repoPermissions.getByServiceId(id);

    if (!service) {
      throw new AppError("Service not found", 404, "SERVICE_NOT_FOUND");
    }

    if (!visibility) {
      throw new AppError("Service not found", 404, "SERVICE_NOT_FOUND");
    }

    return {
      services: service,
      visibility: visibility,
      permissions: permissions,
    };
  };

  create = async (service: CreateServicesDto) => {
    const newService = await this.repo.createServices(service);
    await eventBus.emit("SERVICE_CREATED", newService);
    return newService;
  };

  deleteOne = async (id: number) => {
    const deletedCount = await this.repo.deleteOneServices(id);

    if (!deletedCount) {
      throw new AppError("Service not found", 404, "SERVICE_NOT_FOUND");
    }

    return deletedCount;
  };

  update = async (
  id: number,
  service: UpdateServicesDto,
  permissions: permissionDto[],
  visibility: visibilityDto[],
) => {
  const updatedCount = await this.repo.updateServices(id, service);

  if (!updatedCount) {
    throw new AppError("Service not found", 404, "SERVICE_NOT_FOUND");
  }

  // PERMISSIONS
  await Promise.all(
    permissions.map(async (p) => {
      if (!p.id || !(p.service_id == id)) {
        throw new AppError("Permission not found", 404, "PERMISSION_NOT_FOUND");
      }

      return this.repoPermissions.updatePermissions(p.id, {
        read: p.read,
        write: p.write,
        edit: p.edit,
        del: p.del,
      });
    })
  );

  // VISIBILITY
  await Promise.all(
    visibility.map(async (v) => {
      if (!v.id || !(v.service_id == id)) {
        throw new AppError("Visibility not found", 404, "VISIBILITY_NOT_FOUND");
      }

      return this.visibilityRepo.updateServiceVisibility(
        v.setor_id,
        v.service_id,
        v.visibility
      );
    })
  );

  return updatedCount;
};

  ServiceVisibilityCreate = async (setor_id: number, service_id: number) => {
    const response = await this.visibilityRepo.ServiceVisibilityCreate(
      setor_id,
      service_id,
    );
    return response;
  };

  findVisiblesRoleServices = async (
    setor_id: number | string,
    role_id: number | string,
  ) => {
    const responseServices = await this.repo.getAllServices({});

    const responseVisibility =
      await this.visibilityRepo.findVisibilityBySetor(setor_id);

    const servicesVisiblesService = new ServicesVisiblesService();

    const visibles = await servicesVisiblesService.execute(
      responseServices.services,
      responseVisibility,
    );

    const userPermissions =
      await this.repoPermissions.getTrueReadPermissionByRoleId(role_id);

    const ServicePermissionId = new Set(
      userPermissions.map((p) => p.service_id),
    );

    const services = visibles.filter((v) => ServicePermissionId.has(v.id));

    const servicesWithPermissions = services.map((s) => ({
      ...s,
      permissions: userPermissions.filter((p) => p.service_id == s.id),
    }));

    return servicesWithPermissions;
  };
}
