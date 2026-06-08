import { QueryParams } from "../../../../core/types/genericTypes.js";
import { RolesRepository } from "../../domain/repository/roles.repository.js";
import { CreateRoleDto, UpdateRoleDto } from "../dto/roles.dto.js";
import { Roles } from "../../domain/entity/Role.js";
import { eventBus } from "../../../../core/event/index.js";

export default class RolesService {
  constructor(
    private repo: RolesRepository,
    private logger: any,
  ) {}

  getAllRoles = async (
    query: QueryParams,
  ): Promise<{ roles: Roles[]; count: number }> => {
    
    const data = await this.repo.getAllRoles(query);
    this.logger.info("Roles recuperadas com sucesso");
    return data;
  };

  getOneRole = async (id: number): Promise<Roles | null> => {
    const data = await this.repo.getOneRoles(id);
    this.logger.info("Roles recuperadas com sucesso");
    return data;
  };

  createRole = async (role: CreateRoleDto): Promise<Roles> => {
    const newRole = await this.repo.createRoles(role);

    eventBus.emit("ROLE_CREATED", newRole);
    this.logger.info("Role criada com sucesso: " + newRole.id);
    return newRole;
  };

  deleteOneRole = async (id: number) => {
    const deletedCount = await this.repo.deleteOneRoles(id);

    if (!deletedCount) {
      throw new Error("Role não encontrada");
    }

    this.logger.info("Role deletada com sucesso: " + id);
    return deletedCount;
  };

  updateRole = async (
    id: number,
    role: UpdateRoleDto,
  ): Promise<Roles | null> => {
    const roleExists = await this.repo.getOneRoles(id);

    if (!roleExists) {
      throw new Error("Role não encontrada");
    }

    const updated = await this.repo.updateRoles(id, role);

    this.logger.info(`Roles atualizada com sucesso \n old: ${JSON.stringify(roleExists)} \n new: ${JSON.stringify(updated)}`);

    return updated;
  };
}
