import { Permissions } from "../../domain/entity/Permission.js";
import { PermissionQuery } from "../../domain/repository/permission-query.js";
import { PermissionUpdateData } from "../../domain/repository/permission.repository.js";

export class FakePermissionRepository {
  permissions = new Map<number, Permissions>([
    [1, new Permissions(6, 1, true, false, false, false, 1)],
  ]);
  lastQuery?: PermissionQuery;
  failUpdate = false;

  async findAll(query: PermissionQuery) {
    this.lastQuery = query;
    return { permissions: [...this.permissions.values()], count: this.permissions.size };
  }

  async findById(id: number) {
    return this.permissions.get(id) ?? null;
  }

  async update(id: number, data: PermissionUpdateData) {
    const current = this.permissions.get(id);
    if (this.failUpdate || !current) return null;
    const updated = new Permissions(
      current.service_id,
      current.role_id,
      data.read,
      data.write,
      data.edit,
      data.del,
      id,
    );
    this.permissions.set(id, updated);
    return updated;
  }

  async findByRoleAndService() { return null; }
  async findReadableByRole() { return []; }
  async create() { return this.permissions.get(1)!; }
}
