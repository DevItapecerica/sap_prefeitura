import test from "node:test";
import assert from "node:assert/strict";
import ServicesService from "../use-case/services.service.js";
import { Services } from "../../domain/entity/Services.js";
import { ServiceVisibility } from "../../domain/entity/ServiceVisibility.js";
import { Permissions } from "../../../permission/domain/entity/Permission.js";
import AppError from "../../../../core/appError.js";

const logger = { info() {} };

class FakeServicesRepository {
  services = new Map<number, Services>([
    [6, new Services(6, "Frente de Trabalho", "FT", "ft", "/ft", new Date(), new Date(), null as any)],
  ]);

  async getAllServices() {
    return { services: [...this.services.values()], count: this.services.size };
  }

  async getOneServices(id: number) {
    return this.services.get(id) ?? null;
  }

  async createServices(data: any) {
    const service = new Services(7, data.name, data.description, data.tag, data.url, new Date(), new Date(), null as any);
    this.services.set(7, service);
    return service;
  }

  async updateServices(id: number, data: any) {
    const current = this.services.get(id);
    if (!current) return null;
    const updated = new Services(id, data.name ?? current.name, data.description ?? current.description, data.tag ?? current.tag, data.url ?? current.url, current.createdAt, new Date(), null as any);
    this.services.set(id, updated);
    return updated;
  }

  async deleteOneServices(id: number) {
    return this.services.delete(id);
  }
}

class FakeVisibilityRepository {
  visibilities = [new ServiceVisibility(1, 6, true, 1), new ServiceVisibility(2, 6, false, 2)];

  async findOneServiceVisibility(serviceId: number) {
    return this.visibilities.filter((visibility) => visibility.service_id === serviceId);
  }

  async ServiceVisibilityCreate(setorId: number, serviceId: number) {
    const visibility = new ServiceVisibility(setorId, serviceId, true, 3);
    this.visibilities.push(visibility);
    return visibility;
  }

  async findVisibilityByServiceAndSetor(setorId: number, serviceId: number) {
    return this.visibilities.find((visibility) => visibility.setor_id === setorId && visibility.service_id === serviceId) ?? null;
  }

  async findVisibilityBySetor(setorId: number) {
    return this.visibilities.filter((visibility) => visibility.setor_id === Number(setorId));
  }

  async updateServiceVisibility(setorId: number, serviceId: number, visibility: boolean) {
    this.visibilities = this.visibilities.map((item) =>
      item.setor_id === setorId && item.service_id === serviceId ? new ServiceVisibility(setorId, serviceId, visibility, item.id) : item,
    );
    return this.visibilities;
  }
}

class FakePermissionRepository {
  permissions = [new Permissions(6, 1, true, false, false, false, 1)];

  async getByServiceId(serviceId: number) {
    return this.permissions.filter((permission) => permission.service_id === serviceId);
  }

  async updatePermissions(id: number, data: any) {
    const permission = this.permissions.find((item) => item.id === id)!;
    Object.assign(permission, data);
    return permission;
  }

  async getTrueReadPermissionByRoleId(roleId: number) {
    return this.permissions.filter((permission) => permission.role_id === Number(roleId) && permission.read);
  }
}

function makeService(repo = new FakeServicesRepository()) {
  return new ServicesService(repo as any, new FakeVisibilityRepository() as any, new FakePermissionRepository() as any, logger);
}

test("ServicesService lista, busca e cria servicos", async () => {
  const service = makeService();

  assert.equal((await service.getAll({})).count, 1);
  assert.equal((await service.getOne(6)).services.name, "Frente de Trabalho");
  assert.equal((await service.create({ name: "Novo", description: "Desc", tag: "novo", url: "/novo" })).id, 7);
});

test("ServicesService rejeita recurso inexistente e atualiza permissoes/visibilidade", async () => {
  const repo = new FakeServicesRepository();
  const service = makeService(repo);

  await assert.rejects(() => service.getOne(99), (error: AppError) => error.code === "SERVICE_NOT_FOUND");
  await assert.rejects(() => service.deleteOne(99), (error: AppError) => error.code === "SERVICE_NOT_FOUND");

  const updated = await service.update(
    6,
    { name: "FT Atualizado", description: "FT", tag: "ft", url: "/ft" },
    [{ id: 1, service_id: 6, read: true, write: true, edit: false, del: false } as any],
    [{ id: 1, service_id: 6, setor_id: 1, visibility: true } as any],
  );

  assert.equal(updated.name, "FT Atualizado");
});

test("ServicesService filtra servicos visiveis com permissao de leitura", async () => {
  const service = makeService();
  const visible = await service.findVisiblesRoleServices(1, 1);

  assert.equal(visible.length, 1);
  assert.equal(visible[0].id, 6);
});
