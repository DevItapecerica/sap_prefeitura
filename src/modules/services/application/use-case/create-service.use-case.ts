import { Services } from "../../domain/entity/Services.js";
import { ServicesRepository } from "../../domain/repository/services.repository.js";
import { CreateServiceDto } from "../dto/create-service.dto.js";

export class CreateServiceUseCase {
  constructor(private readonly repository: ServicesRepository) {}

  execute(data: CreateServiceDto): Promise<Services> {
    return this.repository.createServices({
      ...data,
      tag: data.tag ?? "outros",
    });
  }
}
