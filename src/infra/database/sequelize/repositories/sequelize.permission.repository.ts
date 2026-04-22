import { Op } from "sequelize";
import { QueryParams } from "../../../../core/shared/types/genericTypes.js";
import db from "../index.js";
import { PermissionRepository } from "../../../../modules/permission/domain/repository/permission.repository.js";
import { Permissions } from "../../../../modules/permission/domain/entity/Permission.js";
import { CreatePermissionsDto, UpdatePermissionsDto } from "../../../../modules/permission/application/dto/permissions.dto.js";
import AppError from "../../../../core/appError.js";

export class SequelizePermissionRepository implements PermissionRepository {
  private model = db.PermissionsModel;

  getAllPermissions = async (
    query: QueryParams,
  ): Promise<{ permissions: Permissions[]; count: number }> => {
    const { limit, page, search, order } = query;

    const offset = limit ? Number(page) * Number(limit) : undefined;

    const queryOrder = order ? order.split(":") : ["id", "desc"];

    const where = {
      [Op.or]: [
        { role_id: { [Op.like]: `%${search}%` } },
        { service_id: { [Op.like]: `%${search}%` } },
      ],
    };

    const payload = {
      offset,
      where,
      limit: limit,
      order: [[queryOrder[0], queryOrder[1]]],
    };

    const permissions = await this.model.findAll(payload);

    const count = await this.model.count({ where });

    return { permissions, count: count };
  };

  getOnePermissions = async (id: number): Promise<Permissions | null> => {
    const permission = await this.model.findByPk(id);

    if (!permission) {
      return null;
    }

    return permission;
  };

  getByRoleAndServiceId = async (
    roleId: number,
    serviceId: number,
  ): Promise<Permissions | null> => {
    const permission = await this.model.findOne({
      where: {
        role_id: roleId,
        service_id: serviceId,
      },
    });
    return permission;
  };

  createPermissions = async (
    data: CreatePermissionsDto,
  ): Promise<Permissions> => {
    const newPermission = await this.model.create(data);
    return newPermission;
  };

  createBulkPermissions = async (
    data: CreatePermissionsDto[],
  ): Promise<Permissions[]> => {
    const newPermissions = await this.model.bulkCreate(data);
    return newPermissions.map((p : Permissions) => this.toEntity(p));
  };

  updatePermissions = async (
    id: number,
    data: UpdatePermissionsDto,
  ): Promise<Permissions> => {
    const permission = await this.model.findByPk(id);
    if (!permission) {
      throw new AppError("Permission not found", 404, "PERMISSION_NOT_FOUND");
    }
    await permission.update(data);
    return this.toEntity(permission);
  } ;

  deleteOnePermissions = async (id: number): Promise<boolean> => {
    const permission = await this.model.findByPk(id);
    if (!permission) {
      return false;
    }
    const destroied = await permission.destroy();
    return destroied > 0;
  };

  // 🔥 mapper (ESSENCIAL)
  private toEntity(data: Permissions): Permissions {
    return new Permissions(
      data.service_id,
      data.role_id,
      data.read,
      data.write,
      data.edit,
      data.del,
      data.id
    );
  }
}
