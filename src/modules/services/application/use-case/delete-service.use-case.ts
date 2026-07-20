import AppError from "../../../../core/appError.js";
import { PermissionRepository } from "../../../permission/domain/repository/permission.repository.js";
import { ServiceVisibilityRepository } from "../../domain/repository/service-visibility.repository.js";
import { ServicesRepository } from "../../domain/repository/services.repository.js";
import { DeleteServiceResultDto } from "../dto/delete-service-result.dto.js";
import { loadServiceAggregate } from "../utils/load-service-aggregate.js";

export class DeleteServiceUseCase {
  constructor(
    private readonly servicesRepository: ServicesRepository,
    private readonly visibilityRepository: ServiceVisibilityRepository,
    private readonly permissionRepository: PermissionRepository,
  ) {}

  async execute(id: number): Promise<DeleteServiceResultDto> {
    if (id <= 3) {
      throw new AppError(
        "Não é possível deletar esse serviço",
        403,
        "SERVICE_DELETE_FORBIDDEN",
      );
    }

    const before = await loadServiceAggregate(
      id,
      this.servicesRepository,
      this.visibilityRepository,
      this.permissionRepository,
    );
    const deleted = await this.servicesRepository.deleteOneServices(id);
    if (!deleted) {
      throw new AppError("Service not found", 404, "SERVICE_NOT_FOUND");
    }

    return { before, after: null };
  }
}
