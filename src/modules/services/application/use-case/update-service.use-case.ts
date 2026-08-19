import AppError from "../../../../core/appError.js";
import {
  ServiceAggregateError,
  ServiceAggregateRepository,
} from "../../domain/repository/service-aggregate.repository.js";
import { ServicePermissionDto } from "../dto/service-permission.dto.js";
import { ServiceVisibilityDto } from "../dto/service-visibility.dto.js";
import { ServiceDto } from "../dto/update-service.dto.js";
import { UpdateServiceResultDto } from "../dto/update-service-result.dto.js";

export class UpdateServiceUseCase {
  constructor(private readonly repository: ServiceAggregateRepository) {}

  async execute(
    id: number,
    service: ServiceDto,
    permissions: ServicePermissionDto[] = [],
    visibility: ServiceVisibilityDto[] = [],
  ): Promise<UpdateServiceResultDto> {
    try {
      return await this.repository.update(id, {
        service,
        permissions,
        visibility,
      });
    } catch (error) {
      if (error instanceof ServiceAggregateError) {
        const messages = {
          SERVICE_NOT_FOUND: "Service not found",
          PERMISSION_NOT_FOUND: "Permission not found",
          VISIBILITY_NOT_FOUND: "Visibility not found",
        };
        throw new AppError(messages[error.code], 404, error.code);
      }
      throw error;
    }
  }
}
