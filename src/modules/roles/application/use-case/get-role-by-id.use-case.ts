import AppError from "../../../../core/appError.js";
import { Roles } from "../../domain/entity/Role.js";
import { RolesRepository } from "../../domain/repository/roles.repository.js";

export class GetRoleByIdUseCase {
  constructor(private readonly repository: RolesRepository) {}

  async execute(id: number): Promise<Roles> {
    const role = await this.repository.findById(id);
    if (!role) throw new AppError("Role not found", 404, "ROLE_NOT_FOUND");
    return role;
  }
}
