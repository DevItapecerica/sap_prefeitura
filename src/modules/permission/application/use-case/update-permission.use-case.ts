import AppError from "../../../../core/appError.js";
import { PermissionRepository } from "../../domain/repository/permission.repository.js";
import { UpdatePermissionDto } from "../dto/update-permission.dto.js";
import { UpdatePermissionResultDto } from "../dto/update-permission-result.dto.js";

export class UpdatePermissionUseCase {
  constructor(private readonly repository: PermissionRepository) {}

  async execute(
    id: number,
    input: UpdatePermissionDto,
  ): Promise<UpdatePermissionResultDto> {
    const before = await this.repository.findById(id);
    if (!before) {
      throw new AppError("Permission not found", 404, "PERMISSION_NOT_FOUND");
    }
    const after = await this.repository.update(id, input);
    if (!after) {
      throw new AppError("Permission not found", 404, "PERMISSION_NOT_FOUND");
    }
    return { before, after };
  }
}
