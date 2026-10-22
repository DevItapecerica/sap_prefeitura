import { Roles } from "../../roles/domain/entity/Role.js";
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
    private readonly setorRepository: SetorRepository,
  ) {}

  async ensureForService(serviceId: number): Promise<void> {
    const setores = await this.setorRepository.findAllSetor();
    await Promise.all(setores.map(setor => this.ensureVisibility(setor, serviceId)));
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

  async ensureForRole(_role: Roles): Promise<void> {
    // Creating or renaming a role never grants any permissions.
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

}
