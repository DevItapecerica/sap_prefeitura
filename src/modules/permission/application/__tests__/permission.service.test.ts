import test from "node:test";
import assert from "node:assert/strict";
import PermissionService from "../use-case/permission.service.js";
import { Permissions } from "../../domain/entity/Permission.js";
import AppError from "../../../../core/appError.js";

const logger = { info() {} };

class FakePermissionRepository {
  permissions = new Map<number, Permissions>([
    [1, new Permissions(6, 1, true, false, false, false, 1)],
  ]);
  duplicate = false;

  async getAllPermissions() {
    return { permissions: [...this.permissions.values()], count: this.permissions.size };
  }

  async getOnePermissions(id: number) {
    return this.permissions.get(id) ?? null;
  }

  async getByRoleAndServiceId() {
    return this.duplicate ? new Permissions(6, 1, true, false, false, false, 2) : null;
  }

  async createPermissions(data: any) {
    const permission = new Permissions(data.service_id, data.role_id, data.read, data.write, data.edit, data.del, 2);
    this.permissions.set(2, permission);
    return permission;
  }

  async updatePermissions(id: number, data: any) {
    const current = this.permissions.get(id)!;
    const updated = new Permissions(current.service_id, current.role_id, data.read ?? current.read, data.write ?? current.write, data.edit ?? current.edit, data.del ?? current.del, id);
    this.permissions.set(id, updated);
    return updated;
  }

  async deleteOnePermissions(id: number) {
    return this.permissions.delete(id);
  }

  async getPermissionByRoleId(roleId: number) {
    return [...this.permissions.values()].filter((permission) => permission.role_id === roleId);
  }

  async getTrueReadPermissionByRoleId(roleId: number) {
    return [...this.permissions.values()].filter((permission) => permission.role_id === roleId && permission.read);
  }

  async getByServiceId(serviceId: number) {
    return [...this.permissions.values()].filter((permission) => permission.service_id === serviceId);
  }
}

test("PermissionService cria permissao e rejeita duplicidade", async () => {
  const repo = new FakePermissionRepository();
  const service = new PermissionService(repo as any, logger);

  const created = await service.createPermission({ service_id: 7, role_id: 1, read: true, write: true, edit: false, del: false } as any);
  assert.equal(created.service_id, 7);

  repo.duplicate = true;
  await assert.rejects(
    () => service.createPermission({ service_id: 6, role_id: 1, read: true, write: false, edit: false, del: false } as any),
    (error: AppError) => error.code === "PERMISSION_ALREADY_EXISTS",
  );
});

test("PermissionService busca e atualiza permissao existente", async () => {
  const service = new PermissionService(new FakePermissionRepository() as any, logger);

  assert.equal((await service.getAllPermissions({})).count, 1);
  assert.equal((await service.getOnePermissions(1)).id, 1);
  assert.equal((await service.updatePermission(1, { read: true, write: true, edit: false, del: false })).write, true);
  await assert.rejects(() => service.getOnePermissions(99), (error: AppError) => error.code === "PERMISSION_NOT_FOUND");
  await assert.rejects(() => service.updatePermission(99, { read: false, write: false, edit: false, del: false }), (error: AppError) => error.code === "PERMISSION_NOT_FOUND");
});
