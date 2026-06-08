import { Op } from "sequelize";
import { QueryParams } from "../../../../core/types/genericTypes.js";
import db from "../index.js";
import { RolesRepository } from "../../../../modules/roles/domain/repository/roles.repository.js";
import { Roles } from "../../../../modules/roles/domain/entity/Role.js";
import {
  CreateRoleDto,
  UpdateRoleDto,
} from "../../../../modules/roles/application/dto/roles.dto.js";

export class SequelizeRolesRepository implements RolesRepository {
  private model = db.RolesModel;

  async getAllRoles(
    query: QueryParams,
  ): Promise<{ roles: Roles[]; count: number }> {
    const { page = "0", limit, search = null, order } = query;

    const queryOrder = order ? order.split(":") : ["id", "desc"];
    const queryLimit = limit ? Number(limit) : undefined;

    const offset = queryLimit ? Number(page) * queryLimit : undefined;

    const where = search
      ? {
          [Op.or]: [{ name: { [Op.like]: `%${search}%` } }],
        }
      : {};

    const roles = await this.model.findAndCountAll({
      offset,
      where,
      limit: queryLimit,
      order: [[queryOrder[0], queryOrder[1]]],
    });

    return {
      roles: roles.rows.map((role: any) => this.toEntity(role)),
      count: roles.count,
    };
  }

  async getOneRoles(id: number): Promise<Roles | null> {
    const service = await this.model.findByPk(id);
    return service ? this.toEntity(service) : null;
  }

  async createRoles(service: CreateRoleDto): Promise<Roles> {
    const newService = await this.model.create(service);
    return this.toEntity(newService);
  }

  async deleteOneRoles(id: number): Promise<boolean> {
    const deletedCount = await this.model.destroy({ where: { id } });
    return deletedCount > 0;
  }

  async updateRoles(id: number, role: UpdateRoleDto): Promise<Roles | null> {
    const isRole = await this.model.findByPk(id);

    if (!isRole) {
      return null;
    }

    isRole.name = role.name;
    isRole.save()
    
    return this.toEntity(isRole);
  }

  // 🔥 mapper (ESSENCIAL)
  private toEntity(data: Roles): Roles {
    return new Roles(data.id, data.name);
  }
}
