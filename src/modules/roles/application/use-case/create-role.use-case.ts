import { Roles } from "../../domain/entity/Role.js";
import { RolesRepository } from "../../domain/repository/roles.repository.js";
import { CreateRoleDto } from "../dto/create-role.dto.js";

export class CreateRoleUseCase {
  constructor(private readonly repository: RolesRepository) {}

  execute(input: CreateRoleDto): Promise<Roles> {
    return this.repository.create(input);
  }
}
