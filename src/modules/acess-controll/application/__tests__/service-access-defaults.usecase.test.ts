import test from "node:test";
import assert from "node:assert/strict";
import { Permissions } from "../../../permission/domain/entity/Permission.js";
import { Roles } from "../../../roles/domain/entity/Role.js";
import { Services } from "../../../services/domain/entity/Services.js";
import { ServiceVisibility } from "../../../services/domain/entity/ServiceVisibility.js";
import { Setor } from "../../../setor/domain/entity/Setor.js";
import { ServiceAccessDefaultsUseCase } from "../service-access-defaults.usecase.js";

class FakeServicesRepository {
  services = [
    new Services(9, "Municipes", "Cadastro", "outros", "/municipes", new Date(), new Date(), null as any),
    new Services(10, "Esporte", "Atletas", "outros", "/esporte", new Date(), new Date(), null as any),
  ];

  async getAllServices() {
    return { services: this.services, count: this.services.length };
  }
}

class FakeVisibilityRepository {
  visibilities = [new ServiceVisibility(1, 9, false, 1)];

  async findVisibilityByServiceAndSetor(setorId: number, serviceId: number) {
    return (
      this.visibilities.find(
        (visibility) =>
          visibility.setor_id === setorId && visibility.service_id === serviceId,
      ) ?? null
    );
  }

  async createServiceVisibility(
    setorId: number,
    serviceId: number,
    visibility = false,
  ) {
    const created = new ServiceVisibility(
      setorId,
      serviceId,
      visibility,
      this.visibilities.length + 1,
    );
    this.visibilities.push(created);
    return created;
  }
}

class FakeRolesRepository {
  roles = [new Roles(1, "admin"), new Roles(2, "tecnico")];

  async getAllRoles() {
    return { roles: this.roles, count: this.roles.length };
  }
}

class FakePermissionRepository {
  permissions = [new Permissions(10, 2, true, false, false, false, 1)];

  async getByRoleAndServiceId(roleId: number, serviceId: number) {
    return (
      this.permissions.find(
        (permission) =>
          permission.role_id === roleId && permission.service_id === serviceId,
      ) ?? null
    );
  }

  async createPermissions(data: any) {
    const created = new Permissions(
      data.service_id,
      data.role_id,
      data.read,
      data.write,
      data.edit,
      data.del,
      this.permissions.length + 1,
    );
    this.permissions.push(created);
    return created;
  }
}

class FakeSetorRepository {
  setores = [
    new Setor(1, "Admin", "Setor admin"),
    new Setor(2, "Saude", "Setor saude"),
  ];

  async findAllSetor() {
    return this.setores;
  }
}

const makeUseCase = () => {
  const servicesRepository = new FakeServicesRepository();
  const visibilityRepository = new FakeVisibilityRepository();
  const rolesRepository = new FakeRolesRepository();
  const permissionRepository = new FakePermissionRepository();
  const setorRepository = new FakeSetorRepository();

  return {
    useCase: new ServiceAccessDefaultsUseCase(
      servicesRepository as any,
      visibilityRepository as any,
      rolesRepository as any,
      permissionRepository as any,
      setorRepository as any,
    ),
    visibilityRepository,
    permissionRepository,
  };
};

test("ServiceAccessDefaultsUseCase cria defaults faltantes para servico", async () => {
  const { useCase, permissionRepository, visibilityRepository } = makeUseCase();

  await useCase.ensureForService(10);

  const adminPermission = permissionRepository.permissions.find(
    (permission) => permission.role_id === 1 && permission.service_id === 10,
  );
  const existingTecnicoPermission = permissionRepository.permissions.find(
    (permission) => permission.role_id === 2 && permission.service_id === 10,
  );
  const setorOneVisibility = visibilityRepository.visibilities.find(
    (visibility) => visibility.setor_id === 1 && visibility.service_id === 10,
  );
  const setorTwoVisibility = visibilityRepository.visibilities.find(
    (visibility) => visibility.setor_id === 2 && visibility.service_id === 10,
  );

  assert.deepEqual(
    {
      read: adminPermission?.read,
      write: adminPermission?.write,
      edit: adminPermission?.edit,
      del: adminPermission?.del,
    },
    { read: true, write: true, edit: true, del: true },
  );
  assert.equal(existingTecnicoPermission?.read, true);
  assert.equal(existingTecnicoPermission?.write, false);
  assert.equal(setorOneVisibility?.visibility, true);
  assert.equal(setorTwoVisibility?.visibility, false);
});

test("ServiceAccessDefaultsUseCase cria defaults para role e setor novos", async () => {
  const { useCase, permissionRepository, visibilityRepository } = makeUseCase();

  await useCase.ensureForRole(new Roles(3, "Gestor"));
  await useCase.ensureForSetor(new Setor(3, "Esporte", "Setor esporte"));

  const gestorPermissions = permissionRepository.permissions.filter(
    (permission) => permission.role_id === 3,
  );
  const setorThreeVisibilities = visibilityRepository.visibilities.filter(
    (visibility) => visibility.setor_id === 3,
  );

  assert.equal(gestorPermissions.length, 2);
  assert.ok(
    gestorPermissions.every(
      (permission) =>
        !permission.read &&
        !permission.write &&
        !permission.edit &&
        !permission.del,
    ),
  );
  assert.equal(setorThreeVisibilities.length, 2);
  assert.ok(setorThreeVisibilities.every((visibility) => !visibility.visibility));
});
