import { Permissions } from "../../../permission/domain/entity/Permission.js";
import { Services } from "../../domain/entity/Services.js";
import { ServiceVisibility } from "../../domain/entity/ServiceVisibility.js";
import { ServiceQuery } from "../../domain/repository/service-query.js";
import { ServiceWriteData } from "../../domain/repository/services.repository.js";

const now = new Date("2026-01-01T00:00:00.000Z");

export class FakeServicesRepository {
  services = new Map<number, Services>([
    [6, new Services(6, "Frente de Trabalho", "FT", "ft", "/ft", now, now, null)],
  ]);
  lastQuery?: ServiceQuery;
  writes: string[] = [];
  failUpdate = false;
  failDelete = false;

  getAllServices(query: ServiceQuery) {
    this.lastQuery = query;
    return Promise.resolve({ services: [...this.services.values()], count: this.services.size });
  }

  getOneServices(id: number) {
    return Promise.resolve(this.services.get(id) ?? null);
  }

  createServices(data: ServiceWriteData) {
    this.writes.push("create-service");
    const service = new Services(7, data.name, data.description, data.tag, data.url, now, now, null);
    this.services.set(7, service);
    return Promise.resolve(service);
  }

  updateServices(id: number, data: ServiceWriteData) {
    this.writes.push("update-service");
    const current = this.services.get(id);
    if (this.failUpdate || !current) return Promise.resolve(null);
    const updated = new Services(id, data.name, data.description, data.tag, data.url, current.createdAt, now, null);
    this.services.set(id, updated);
    return Promise.resolve(updated);
  }

  deleteOneServices(id: number) {
    this.writes.push("delete-service");
    if (this.failDelete) return Promise.resolve(false);
    return Promise.resolve(this.services.delete(id));
  }
}

export class FakeVisibilityRepository {
  visibilities = [
    new ServiceVisibility(1, 6, true, 1),
    new ServiceVisibility(2, 6, false, 2),
  ];
  writes: string[] = [];

  findOneServiceVisibility(serviceId: number) {
    return Promise.resolve(this.visibilities.filter((item) => item.service_id === serviceId));
  }

  createServiceVisibility(setorId: number, serviceId: number, visibility = false) {
    const created = new ServiceVisibility(setorId, serviceId, visibility, 3);
    this.visibilities.push(created);
    return Promise.resolve(created);
  }

  findVisibilityByServiceAndSetor(setorId: number, serviceId: number) {
    return Promise.resolve(this.visibilities.find((item) => item.setor_id === setorId && item.service_id === serviceId) ?? null);
  }

  findVisibilityBySetor(setorId: number | string) {
    return Promise.resolve(this.visibilities.filter((item) => item.setor_id === Number(setorId)));
  }

  updateServiceVisibility(id: number, visibility: boolean) {
    this.writes.push("update-visibility");
    const index = this.visibilities.findIndex((item) => item.id === id);
    if (index < 0) return Promise.resolve(null);
    const current = this.visibilities[index];
    const updated = new ServiceVisibility(current.setor_id, current.service_id, visibility, current.id);
    this.visibilities[index] = updated;
    return Promise.resolve(updated);
  }
}

export class FakePermissionRepository {
  permissions = [
    new Permissions(6, 1, true, false, false, false, 1),
    new Permissions(6, 2, true, false, false, false, 2),
  ];
  writes: string[] = [];

  getByServiceId(serviceId: number) {
    return Promise.resolve(this.permissions.filter((item) => item.service_id === serviceId));
  }

  updatePermissions(id: number, data: Partial<Permissions>) {
    this.writes.push("update-permission");
    const index = this.permissions.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("Permission not found");
    const current = this.permissions[index];
    const updated = new Permissions(
      current.service_id,
      current.role_id,
      data.read ?? current.read,
      data.write ?? current.write,
      data.edit ?? current.edit,
      data.del ?? current.del,
      current.id,
    );
    this.permissions[index] = updated;
    return Promise.resolve(updated);
  }

  getTrueReadPermissionByRoleId(roleId: number | string) {
    return Promise.resolve(this.permissions.filter((item) => item.role_id === Number(roleId) && item.read));
  }
}

export const makeServiceFakes = () => ({
  services: new FakeServicesRepository(),
  visibility: new FakeVisibilityRepository(),
  permissions: new FakePermissionRepository(),
});
