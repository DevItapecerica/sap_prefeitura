import { IBolsistaRepository } from "../../domain/repository/IBolsistaRepository.js";
import { BolsistaQueryDto } from "../dto/bolsista-query.dto.js";

export default class GetBolsistaUseCase {
  constructor(private bolsistaRepository: IBolsistaRepository) {}

  async execute(query: BolsistaQueryDto, uuid?: string | number) {
    if (uuid) {
      const response = await this.bolsistaRepository.findById(uuid);
      return response;
    }

    const response = await this.bolsistaRepository.findAll(query);

    return response;
  }
}
