import AppError from "../../../../core/appError.js";
import { Permissions } from "../../domain/entity/Permission.js";
import { PermissionRepository } from "../../domain/repository/permission.repository.js";

export class GetPermissionByIdUseCase {
  constructor(private readonly repository: PermissionRepository) {}

  async execute(id: number): Promise<Permissions> {
    const permission = await this.repository.findById(id);
    if (!permission) {
      throw new AppError("Permission not found", 404, "PERMISSION_NOT_FOUND");
    }
    return permission;
  }
}
