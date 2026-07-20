import AppError from "../../../../core/appError.js";
import {
  ServiceAggregateError,
  ServiceAggregateRepository,
} from "../../domain/repository/service-aggregate.repository.js";
import { DeleteServiceResultDto } from "../dto/delete-service-result.dto.js";

export class DeleteServiceUseCase {
  constructor(private readonly repository: ServiceAggregateRepository) {}

  async execute(id: number): Promise<DeleteServiceResultDto> {
    if (id <= 3) {
      throw new AppError(
        "Não é possível deletar esse serviço",
        403,
        "SERVICE_DELETE_FORBIDDEN",
      );
    }

    try {
      return await this.repository.delete(id);
    } catch (error) {
      if (
        error instanceof ServiceAggregateError &&
        error.code === "SERVICE_NOT_FOUND"
      ) {
        throw new AppError("Service not found", 404, "SERVICE_NOT_FOUND");
      }
      throw error;
    }
  }
}
