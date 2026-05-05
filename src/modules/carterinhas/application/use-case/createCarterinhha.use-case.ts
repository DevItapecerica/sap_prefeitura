import Carterinha from "../../domain/entity/Carteirinha.js";
import { PostCarterinhaDto } from "../dto/carterinha.dto.js";
import MunicipeRepository from "../../../municipe/domain/repositories/Municipe.repository.js";
import { AppError } from "../../../../core/appError.js";
import { CarterinhaPolicy } from "../../domain/service/carterinhaPolicy.js";
import { SetorRepository } from "../../../setor/domain/repository/setor.repository.js";
import CarterinhaRepository from "../../domain/repositories/carterinha.repository.js";

export default class CreateCarterinhaUseCase {
  constructor(private municipeRepository: MunicipeRepository, private setorRepository: SetorRepository, private carterinhaRepository: CarterinhaRepository) {}

  async execute(data: PostCarterinhaDto): Promise<Carterinha> {
    const municipeExists = await this.municipeRepository.getMunicipeById(
      data.municipe_uuid
    )
    
    if(!municipeExists){
      throw new AppError("Municipe not found", 404, "MUNICIPE_NOT_FOUND");
    }

    const setorExists = await this.setorRepository.findOneSetor(data.setor_uuid);
    if(!setorExists){
      throw new AppError("Setor not found", 404, "SETOR_NOT_FOUND");
    }

    const carterinhaPolicy = new CarterinhaPolicy();
    const validade = carterinhaPolicy.calcularValidade(data.emissao);

    const newCarterinha = new Carterinha(
      data.emissao,
      validade,
      data.setor_uuid,
      data.atividade_uuid || null,
      data.municipe_uuid
    );

    return await this.carterinhaRepository.postCarterinhas(newCarterinha);
  }
}
