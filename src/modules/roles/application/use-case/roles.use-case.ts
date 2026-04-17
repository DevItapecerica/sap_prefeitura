import { QueryParams } from "../../../../core/shared/types/genericTypes.js";
import { RolesRepository } from "../../domain/repository/roles.repository.js";
import { CreateRoleDto, UpdateRoleDto } from "../dto/roles.dto.js";
import PermissionService from "../../../permission/permission.service.js";
import { Roles } from "../../domain/entity/Role.js";

export default class RolesService {
  constructor(
    private repo: RolesRepository,
    private permissionService: PermissionService,
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

    this.permissionService.createPermissionsAllServices(newRole);

    this.logger.info("Role criada com sucesso");
    return newRole;
  };

  deleteOneRole = async (id: number) => {
    const deletedCount = await this.repo.deleteOneRoles(id);

    if (!deletedCount) {
      throw new Error("Role não encontrada");
    }

    this.logger.info("Role deletada com sucesso");
    return deletedCount;
  };

  updateRole = async (
    id: number,
    role: UpdateRoleDto,
  ): Promise<Roles | null> => {
    const updated = await this.repo.updateRoles(id, role);

    if (!updated) {
      throw new Error("Role não encontrada");
    }

    this.logger.info("Roles atualizada com sucesso");

    return updated;
  };
}
