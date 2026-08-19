import AppError from "../../../../core/appError.js";
import { ServiceAggregateRepository } from "../../domain/repository/service-aggregate.repository.js";
import { ServiceAggregateDto } from "../dto/service-aggregate.dto.js";

export class GetServiceByIdUseCase {
  constructor(private readonly repository: ServiceAggregateRepository) {}

  async execute(id: number): Promise<ServiceAggregateDto> {
    const aggregate = await this.repository.findById(id);
    if (!aggregate) {
      throw new AppError("Service not found", 404, "SERVICE_NOT_FOUND");
    }
    return aggregate;
  }
}
