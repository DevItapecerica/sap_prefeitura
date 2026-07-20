import { Permissions } from "../../../permission/domain/entity/Permission.js";
import { Roles } from "../../domain/entity/Role.js";
import { RoleQuery } from "../../domain/repository/role-query.js";
import { RoleWriteData } from "../../domain/repository/roles.repository.js";

export class FakeRolesRepository {
  roles = new Map<number, Roles>([[1, new Roles(1, "Admin")], [2, new Roles(2, "Gestor")]]);
  lastQuery?: RoleQuery;
  roleInUse = false;
  failUpdate = false;

  async findAll(query: RoleQuery) {
    this.lastQuery = query;
    return { roles: [...this.roles.values()], count: this.roles.size };
  }

  async findById(id: number) {
    return this.roles.get(id) ?? null;
  }

  async create(data: RoleWriteData) {
    const role = new Roles(3, data.name);
    this.roles.set(3, role);
    return role;
  }

  async update(id: number, data: RoleWriteData) {
    if (this.failUpdate || !this.roles.has(id)) return null;
    const role = new Roles(id, data.name);
    this.roles.set(id, role);
    return role;
  }

  async deleteWithPermissions(id: number) {
    const role = this.roles.get(id);
    if (!role) return { status: "not_found" as const };
    if (this.roleInUse) return { status: "in_use" as const };
    this.roles.delete(id);
    return {
      status: "deleted" as const,
      before: {
        role,
        permissions: [new Permissions(6, id, true, false, false, false, 1)],
      },
    };
  }
}
