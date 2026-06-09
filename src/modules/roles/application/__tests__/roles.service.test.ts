import test from "node:test";
import assert from "node:assert/strict";
import RolesService from "../use-case/roles.use-case.js";
import { Roles } from "../../domain/entity/Role.js";

const logger = { info() {} };

class FakeRolesRepository {
  roles = new Map<number, Roles>([[1, new Roles(1, "Admin")]]);

  async getAllRoles() {
    return { roles: [...this.roles.values()], count: this.roles.size };
  }

  async getOneRoles(id: number) {
    return this.roles.get(id) ?? null;
  }

  async createRoles(data: any) {
    const role = new Roles(2, data.name);
    this.roles.set(2, role);
    return role;
  }

  async updateRoles(id: number, data: any) {
    const role = new Roles(id, data.name);
    this.roles.set(id, role);
    return role;
  }

  async deleteOneRoles(id: number) {
    return this.roles.delete(id);
  }
}

test("RolesService cria, lista e atualiza roles", async () => {
  const service = new RolesService(new FakeRolesRepository() as any, logger);

  assert.equal((await service.getAllRoles({})).count, 1);
  assert.equal((await service.createRole({ name: "Operador" })).name, "Operador");
  assert.equal((await service.updateRole(1, { name: "Gestor" }))?.name, "Gestor");
});

test("RolesService rejeita delete/update de role inexistente", async () => {
  const service = new RolesService(new FakeRolesRepository() as any, logger);

  await assert.rejects(() => service.deleteOneRole(99), /Role/);
  await assert.rejects(() => service.updateRole(99, { name: "Missing" }), /Role/);
});
