import AppError from "../../../../core/appError.js";
import { RolesRepository } from "../../domain/repository/roles.repository.js";
import { UpdateRoleDto } from "../dto/update-role.dto.js";
import { UpdateRoleResultDto } from "../dto/update-role-result.dto.js";

export class UpdateRoleUseCase {
  constructor(private readonly repository: RolesRepository) {}

  async execute(id: number, input: UpdateRoleDto): Promise<UpdateRoleResultDto> {
    const before = await this.repository.findById(id);
    if (!before) throw new AppError("Role not found", 404, "ROLE_NOT_FOUND");
    const after = await this.repository.update(id, input);
    if (!after) throw new AppError("Role not found", 404, "ROLE_NOT_FOUND");
    return { before, after };
  }
}
