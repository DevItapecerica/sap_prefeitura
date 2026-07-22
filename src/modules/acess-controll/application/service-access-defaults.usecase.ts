import { PermissionRepository } from "../../permission/domain/repository/permission.repository.js";
import { Roles } from "../../roles/domain/entity/Role.js";
import { RolesRepository } from "../../roles/domain/repository/roles.repository.js";
import { Services } from "../../services/domain/entity/Services.js";
import {
  ServicesRepository,
} from "../../services/domain/repository/services.repository.js";
import { ServiceVisibilityRepository } from "../../services/domain/repository/service-visibility.repository.js";
import { Setor } from "../../setor/domain/entity/Setor.js";
import { SetorRepository } from "../../setor/domain/repository/setor.repository.js";

export class ServiceAccessDefaultsUseCase {
  constructor(
    private readonly servicesRepository: ServicesRepository,
    private readonly serviceVisibilityRepository: ServiceVisibilityRepository,
    private readonly rolesRepository: RolesRepository,
    private readonly permissionRepository: PermissionRepository,
    private readonly setorRepository: SetorRepository,
  ) {}

  async ensureForService(serviceId: number): Promise<void> {
    const [{ roles }, setores] = await Promise.all([
      this.rolesRepository.findAll({ page: 0, order: "id:asc" }),
      this.setorRepository.findAllSetor(),
    ]);

    await Promise.all([
      ...roles.map((role) => this.ensurePermission(role, serviceId)),
      ...setores.map((setor) => this.ensureVisibility(setor, serviceId)),
    ]);
  }

  async reconcile(): Promise<void> {
    const { services } = await this.servicesRepository.getAllServices({
      page: 0,
      order: "id:asc",
    });
    for (const service of services) {
      await this.ensureForService(service.id);
    }
  }

  async ensureForRole(role: Roles): Promise<void> {
    const { services } = await this.servicesRepository.getAllServices({
      page: 0,
      order: "id:desc",
    });

    await Promise.all(
      services.map((service) => this.ensurePermission(role, service.id)),
    );
  }

  async ensureForSetor(setor: Setor): Promise<void> {
    const { services } = await this.servicesRepository.getAllServices({
      page: 0,
      order: "id:desc",
    });

    await Promise.all(
      services.map((service) => this.ensureVisibility(setor, service.id)),
    );
  }

  private async ensurePermission(role: Roles, serviceId: number): Promise<void> {
    const existing = await this.permissionRepository.findByRoleAndService(
      role.id,
      serviceId,
    );

    if (existing) return;

    const allowed = this.isAdminRole(role);

    await this.permissionRepository.create({
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

    await this.serviceVisibilityRepository.createServiceVisibility(
      setor.id,
      serviceId,
      setor.id === 1,
    );
  }

  private isAdminRole(role: Roles): boolean {
    return role.id === 1 || role.name.toLowerCase() === "admin";
  }
}
