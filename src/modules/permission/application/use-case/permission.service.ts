import { QueryParams } from "../../../../core/shared/types/genericTypes.js";
import { CreateServicesDto, UpdateServicesDto } from "./dto/services.dto.js";
import { PermissionRepository } from "../../domain/repository/permission.repository.js";

export default class PermissionService {
  constructor(private repo: PermissionRepository, private logger: any){}
  getAll = async (query: QueryParams) => {

    return await this.repo.getAllServices(query);
  };

  getOne = async (id: number) => {
    return await this.repo.getOneServices(id);
  };

  create = async (service: CreateServicesDto) => {
    const newService = await this.repo.createServices(service);
    return newService;
  };

  deleteOne = async (id: number) => {
    const deletedCount = await this.repo.deleteOneServices(id);
    return deletedCount;
  };

  update = async (id: number, service: UpdateServicesDto) => {
    const updatedCount = await this.repo.updateServices(id, service);
    return updatedCount;
  };

  createPermissionsAllServices = async (id: number) => {}

}
