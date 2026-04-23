import AppError from "../../../../core/appError.js";
import { QueryParams } from "../../../../core/shared/types/genericTypes.js";
import { CreateServicesDto, UpdateServicesDto } from "../dto/services.dto.js";
import {
  ServicesRepository,
  serviceVisibilityRepository,
} from "../../domain/repository/services.repository.js";
import { Services } from "../../domain/entity/Services.js";
import { ServiceVisibility } from "../../domain/entity/ServiceVisibility.js";
import { eventBus } from "../../../../core/event/index.js";
import { PermissionRepository } from "../../../permission/domain/repository/permission.repository.js";
import { Permissions } from "../../../permission/domain/entity/Permission.js";

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
  ): Promise<{ services: Services; visibility: ServiceVisibility[], permissions: Permissions[] }> => {
    const service = await this.repo.getOneServices(id);
    const visibility = await this.visibilityRepo.findOneServiceVisibility(id);
    const permissions = await this.repoPermissions.getByServiceId(id);

    if (!service) {
      throw new AppError("Service not found", 404, "SERVICE_NOT_FOUND");
    }

    if (!visibility) {
      throw new AppError("Service not found", 404, "SERVICE_NOT_FOUND");
    }

    return { services: service, visibility: visibility, permissions: permissions };
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

  update = async (id: number, service: UpdateServicesDto) => {
    const updatedCount = await this.repo.updateServices(id, service);
    if (!updatedCount) {
      throw new AppError("Service not found", 404, "SERVICE_NOT_FOUND");
    }
    return updatedCount;
  };

  ServiceVisibilityCreate = async (setor_id: number, service_id: number) => {
    const response = await this.visibilityRepo.ServiceVisibilityCreate(
      setor_id,
      service_id,
    );
    return response;
  };
}
