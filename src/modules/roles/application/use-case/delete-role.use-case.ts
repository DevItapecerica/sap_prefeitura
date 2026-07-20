import AppError from "../../../../core/appError.js";
import { RolesRepository } from "../../domain/repository/roles.repository.js";
import { DeleteRoleResultDto } from "../dto/delete-role-result.dto.js";

export class DeleteRoleUseCase {
  constructor(private readonly repository: RolesRepository) {}

  async execute(id: number): Promise<DeleteRoleResultDto> {
    if (id === 1) {
      throw new AppError(
        "Admin role cannot be deleted",
        403,
        "ROLE_DELETE_FORBIDDEN",
      );
    }
    const result = await this.repository.deleteWithPermissions(id);
    if (result.status === "not_found") {
      throw new AppError("Role not found", 404, "ROLE_NOT_FOUND");
    }
    if (result.status === "in_use") {
      throw new AppError("Role has associated users", 409, "ROLE_IN_USE");
    }
    return { before: result.before, after: null };
  }
}
