import { Bolsista } from "../../domain/entity/Bolsista.js";
import { IBolsistaRepository } from "../../domain/repository/IBolsistaRepository.js";
import { BolsistaQueryDto } from "../dto/bolsista-query.dto.js";

export default class GetBolsistaUseCase {
  constructor(private bolsistaRepository: IBolsistaRepository) {}

  async execute(query: BolsistaQueryDto):  Promise<{bolsistas: Bolsista[], count: number}> {
    const response = await this.bolsistaRepository.findAll(query);

    return response;
  }
}
