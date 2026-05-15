import { AppError } from "../../../../core/appError.js";
import IMunicipeRepository from "../../../municipe/domain/repositories/Municipe.repository.js";
import { Bolsista } from "../../domain/entity/Bolsista.js";
import { IBolsistaRepository } from "../../domain/repository/IBolsistaRepository.js";
import { bolsistaDto } from "../dto/bolsista.dto.js";

export default class PostBolsistaUseCase {
  constructor(
    private bolsistaRepository: IBolsistaRepository,
    private municipeRepository: IMunicipeRepository,
  ) {}

  async execute(bolsista: bolsistaDto): Promise<Bolsista | null> {
    const existMunicipe = await this.municipeRepository.getMunicipeById(bolsista.municipe_uuid);

    if (!existMunicipe) throw new AppError("Municipe not found", 404, "MUNICIPE_NOT_FOUND");
    const response = await this.bolsistaRepository.save(bolsista);
    return response;
  }
}
