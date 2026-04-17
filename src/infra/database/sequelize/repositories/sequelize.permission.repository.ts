import { Op } from "sequelize";
import { QueryParams } from "../../../../core/shared/types/genericTypes.js";
import db from "../index.js";
import { PermissionRepository } from "../../../../modules/permission/domain/repository/permission.repository.js";

export class SequelizePermissionRepository implements PermissionRepository {
  private model = db.RolesModel;

  async getAllRoles(query: QueryParams): Promise<{roles: Roles[], count: number}> {
    const { page = "0", limit, search = null, order = "id:desc" } = query;
    
    const queryOrder = order ? order.split(":") : ["id", "desc"];

    const offset = limit ? Number(page) * Number(limit) : undefined;

    const where = search
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};


    const roles = await this.model.findAndCountAll({
      offset,
      where,
      limit: limit,
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

    const updated = await this.model.update(role, { where: { id } });

    return this.toEntity(updated);
  }


  // 🔥 mapper (ESSENCIAL)
  private toEntity(data: Roles): Roles {
    return new Roles(
      data.id,
      data.name,
    );
  }
}
