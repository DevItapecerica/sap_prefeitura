import { Bolsista } from "../../domain/entity/Bolsista.js";
import { IBolsistaRepository } from "../../domain/repository/IBolsistaRepository.js";

export default class getOneBolsistaUseCase {
  constructor(private bolsistaRepository: IBolsistaRepository) {}

  async execute(uuid: string | number): Promise<Bolsista | null> {
      const response = await this.bolsistaRepository.findById(uuid);
      return response;
  }
}
