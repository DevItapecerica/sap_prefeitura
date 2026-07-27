import { Model, Op } from "sequelize";
import { Permissions } from "../../../../modules/permission/domain/entity/Permission.js";
import { Roles } from "../../../../modules/roles/domain/entity/Role.js";
import { RoleListResult } from "../../../../modules/roles/domain/repository/role-list-result.js";
import { RoleQuery } from "../../../../modules/roles/domain/repository/role-query.js";
import {
  DeleteRoleRepositoryResult,
  RolesRepository,
  RoleWriteData,
} from "../../../../modules/roles/domain/repository/roles.repository.js";
import db from "../index.js";

export class SequelizeRolesRepository implements RolesRepository {
  private readonly roles;
  private readonly permissions;
  private readonly users;

  constructor(private readonly database: typeof db = db) {
    this.roles = database.RolesModel;
    this.permissions = database.PermissionsModel;
    this.users = database.UserModel;
  }

  async findAll(query: RoleQuery): Promise<RoleListResult> {
    const { page, limit, search, order } = query;
    const [field, direction] = order.split(":");
    const where = search
      ? { name: { [Op.like]: `%${search}%` } }
      : undefined;
    const result = await this.roles.findAndCountAll({
      where,
      limit,
      offset: limit === undefined ? undefined : page * limit,
      order: [[field, direction]],
    });
    return {
      roles: result.rows.map((role: Model) => this.toRole(role)),
      count: result.count,
    };
  }

  async findById(id: number): Promise<Roles | null> {
    const role = await this.roles.findByPk(id);
    return role ? this.toRole(role) : null;
  }

  async create(data: RoleWriteData): Promise<Roles> {
    return this.toRole(await this.roles.create(data));
  }

  async update(id: number, data: RoleWriteData): Promise<Roles | null> {
    const role = await this.roles.findByPk(id);
    if (!role) return null;
    await role.update(data);
    return this.toRole(role);
  }

  deleteWithPermissions(id: number): Promise<DeleteRoleRepositoryResult> {
    return this.database.sequelize.transaction(async (transaction) => {
      const lock = transaction.LOCK.UPDATE;
      const role = await this.roles.findByPk(id, { transaction, lock });
      if (!role) return { status: "not_found" };

      const user = await this.users.findOne({
        where: { role_id: id },
        attributes: ["id"],
        paranoid: false,
        transaction,
        lock,
      });
      if (user) return { status: "in_use" };

      const permissionRows = await this.permissions.findAll({
        where: { role_id: id },
        transaction,
        lock,
      });
      const before = {
        role: this.toRole(role),
        permissions: permissionRows.map((permission: Model) =>
          this.toPermission(permission),
        ),
      };

      await this.permissions.destroy({
        where: { role_id: id },
        force: true,
        transaction,
      });
      await role.destroy({ transaction });
      return { status: "deleted", before };
    });
  }

  private toRole(row: Model): Roles {
    return new Roles(Number(row.get("id")), String(row.get("name")));
  }

  private toPermission(row: Model): Permissions {
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
