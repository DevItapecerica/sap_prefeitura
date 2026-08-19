import { Model, Op } from "sequelize";
import { Permissions } from "../../../../modules/permission/domain/entity/Permission.js";
import { PermissionListResult } from "../../../../modules/permission/domain/repository/permission-list-result.js";
import { PermissionQuery } from "../../../../modules/permission/domain/repository/permission-query.js";
import {
  PermissionCreateData,
  PermissionRepository,
  PermissionUpdateData,
} from "../../../../modules/permission/domain/repository/permission.repository.js";
import db from "../index.js";

export class SequelizePermissionRepository implements PermissionRepository {
  private readonly model = db.PermissionsModel;

  async findAll(query: PermissionQuery): Promise<PermissionListResult> {
    const { page, limit, search, order } = query;
    const [field, direction] = order.split(":");
    const where = search
      ? {
          [Op.or]: [
            { role_id: { [Op.like]: `%${search}%` } },
            { service_id: { [Op.like]: `%${search}%` } },
          ],
        }
      : undefined;
    const result = await this.model.findAndCountAll({
      where,
      limit,
      offset: limit === undefined ? undefined : page * limit,
      order: [[field, direction]],
    });
    return {
      permissions: result.rows.map((row: Model) => this.toEntity(row)),
      count: result.count,
    };
  }

  async findById(id: number): Promise<Permissions | null> {
    const permission = await this.model.findByPk(id);
    return permission ? this.toEntity(permission) : null;
  }

  async findByRoleAndService(
    roleId: number,
    serviceId: number,
  ): Promise<Permissions | null> {
    const permission = await this.model.findOne({
      where: { role_id: roleId, service_id: serviceId },
    });
    return permission ? this.toEntity(permission) : null;
  }

  async findReadableByRole(
    roleId: number | string,
  ): Promise<Permissions[]> {
    const permissions = await this.model.findAll({
      where: { role_id: roleId, read: true },
    });
    return permissions.map((row: Model) => this.toEntity(row));
  }

  async create(data: PermissionCreateData): Promise<Permissions> {
    return this.toEntity(await this.model.create(data));
  }

  async update(
    id: number,
    data: PermissionUpdateData,
  ): Promise<Permissions | null> {
    const permission = await this.model.findByPk(id);
    if (!permission) return null;
    await permission.update(data);
    return this.toEntity(permission);
  }

  private toEntity(row: Model): Permissions {
    return new Permissions(
      Number(row.get("service_id")),
      Number(row.get("role_id")),
      Boolean(row.get("read")),
      Boolean(row.get("write")),
      Boolean(row.get("edit")),
      Boolean(row.get("del")),
      Number(row.get("id")),
    );
  }
}
