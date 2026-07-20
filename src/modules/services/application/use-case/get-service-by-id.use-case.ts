import { PermissionRepository } from "../../../permission/domain/repository/permission.repository.js";
import { ServiceVisibilityRepository } from "../../domain/repository/service-visibility.repository.js";
import { ServicesRepository } from "../../domain/repository/services.repository.js";
import { ServiceAggregateDto } from "../dto/service-aggregate.dto.js";
import { loadServiceAggregate } from "../utils/load-service-aggregate.js";

export class GetServiceByIdUseCase {
  constructor(
    private readonly servicesRepository: ServicesRepository,
    private readonly visibilityRepository: ServiceVisibilityRepository,
    private readonly permissionRepository: PermissionRepository,
  ) {}

  execute(id: number): Promise<ServiceAggregateDto> {
    return loadServiceAggregate(
      id,
      this.servicesRepository,
      this.visibilityRepository,
      this.permissionRepository,
    );
  }
}
