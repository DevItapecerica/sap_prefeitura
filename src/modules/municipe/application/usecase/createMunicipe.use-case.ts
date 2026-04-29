import AppError from "../../../../core/appError.js";
import Municipe from "../../domain/entity/Municipe.js";
import MunicipeRepository from "../../domain/repositories/Municipe.repository.js";
import { MunicipeDto } from "../dto/municipe.dto.js";

export default class createMunicipeUseCase {
  constructor(private municipeRepository: MunicipeRepository) {}

  async execute(municipe: MunicipeDto, author: string): Promise<Municipe> {
    const alreadyExists = municipe.cpf
      ? await this.municipeRepository.getMunicipeByCpf(municipe.cpf)
      : false;

    if (alreadyExists) {
      throw new AppError(
        "Municipe already exists",
        409,
        "MUNICIPE_ALREADY_EXISTS",
      );
    }
    const response = await this.municipeRepository.createMunicipe(
      municipe,
      author,
    );

    return response;
  }
}
