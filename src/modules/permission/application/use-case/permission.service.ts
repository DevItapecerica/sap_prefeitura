import { QueryParams } from "../../../../core/shared/types/genericTypes.js";
import { PermissionRepository } from "../../domain/repository/permission.repository.js";
import { CreatePermissionsDto, UpdatePermissionsDto } from "../dto/permissions.dto.js";
import AppError from "../../../../core/appError.js";

export default class PermissionService {
  constructor(private repo: PermissionRepository, private logger: any){}
  getAllPermissions = async (query: QueryParams) => {

    const data = await this.repo.getAllPermissions(query);
    this.logger.info("Permissions recuperadas com sucesso");
    return data;
  };

  getOnePermissions = async (id: number) => {
    const permission = await this.repo.getOnePermissions(id);

    if (!permission) {
      throw new AppError("Permission not found", 404, "PERMISSION_NOT_FOUND");
    }

    return permission
  };

  createPermission = async (data: CreatePermissionsDto) => {
    const alredyExist = await this.repo.getByRoleAndServiceId(data.role_id, data.service_id);

    if (alredyExist) {
      throw new AppError(
        "Permission already exists",
        409,
        "PERMISSION_ALREADY_EXISTS",
      );
    }

    const newPermission = await this.repo.createPermissions(data);
    this.logger.info("Permission criada com sucesso: " + newPermission);
    return newPermission;
  };

  deleteOne = async (id: number) => {
    const deletedCount = await this.repo.deleteOnePermissions(id);
    return deletedCount;
  };

  updatePermission = async (id: number, data: UpdatePermissionsDto) => {
    const exist = await this.repo.getOnePermissions(id);

    if (!exist) {
      throw new AppError("Permission not found", 404, "PERMISSION_NOT_FOUND");
    }

    const updated = await this.repo.updatePermissions(id, data);

    this.logger.info(`Permission ${id} atualizada com sucesso: \n old: ${JSON.stringify(exist)} \n new: ${JSON.stringify(updated)}`);
    return updated;
  };

}
