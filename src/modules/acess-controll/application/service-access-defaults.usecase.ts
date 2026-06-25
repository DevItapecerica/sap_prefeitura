import { PermissionRepository } from "../../permission/domain/repository/permission.repository.js";
import { Roles } from "../../roles/domain/entity/Role.js";
import { RolesRepository } from "../../roles/domain/repository/roles.repository.js";
import { Services } from "../../services/domain/entity/Services.js";
import {
  ServicesRepository,
  serviceVisibilityRepository,
} from "../../services/domain/repository/services.repository.js";
import { Setor } from "../../setor/domain/entity/Setor.js";
import { SetorRepository } from "../../setor/domain/repository/setor.repository.js";

export class ServiceAccessDefaultsUseCase {
  constructor(
    private servicesRepository: ServicesRepository,
    private serviceVisibilityRepository: serviceVisibilityRepository,
    private rolesRepository: RolesRepository,
    private permissionRepository: PermissionRepository,
    private setorRepository: SetorRepository,
  ) {}

  async ensureForService(serviceId: number): Promise<void> {
    const [{ roles }, setores] = await Promise.all([
      this.rolesRepository.getAllRoles({}),
      this.setorRepository.findAllSetor({}),
    ]);

    await Promise.all([
      ...roles.map((role) => this.ensurePermission(role, serviceId)),
      ...setores.map((setor) => this.ensureVisibility(setor, serviceId)),
    ]);
  }

  async ensureForRole(role: Roles): Promise<void> {
    const { services } = await this.servicesRepository.getAllServices({});

    await Promise.all(
      services.map((service) => this.ensurePermission(role, service.id)),
    );
  }

  async ensureForSetor(setor: Setor): Promise<void> {
    const { services } = await this.servicesRepository.getAllServices({});

    await Promise.all(
      services.map((service) => this.ensureVisibility(setor, service.id)),
    );
  }

  private async ensurePermission(role: Roles, serviceId: number): Promise<void> {
    const existing = await this.permissionRepository.getByRoleAndServiceId(
      role.id,
      serviceId,
    );

    if (existing) return;

    const allowed = this.isAdminRole(role);

    await this.permissionRepository.createPermissions({
      role_id: role.id,
      service_id: serviceId,
      read: allowed,
      write: allowed,
      edit: allowed,
      del: allowed,
    });
  }

  private async ensureVisibility(setor: Setor, serviceId: number): Promise<void> {
    const existing =
      await this.serviceVisibilityRepository.findVisibilityByServiceAndSetor(
        setor.id,
        serviceId,
      );

    if (existing) return;

    await this.serviceVisibilityRepository.ServiceVisibilityCreate(
      setor.id,
      serviceId,
      setor.id === 1,
    );
  }

  private isAdminRole(role: Roles): boolean {
    return role.id === 1 || role.name.toLowerCase() === "admin";
  }
}
