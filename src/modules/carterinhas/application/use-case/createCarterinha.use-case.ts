import Carterinha from "../../domain/entity/Carteirinha.js";
import { PostCarterinhaDto } from "../dto/carterinha.dto.js";
import MunicipeRepository from "../../../municipe/domain/repositories/Municipe.repository.js";
import { AppError } from "../../../../core/appError.js";
import { CarterinhaPolicy } from "../../domain/service/carterinhaPolicy.js";
import CarterinhaRepository from "../../domain/repositories/carterinha.repository.js";

export default class CreateCarterinhaUseCase {
  constructor(private municipeRepository: MunicipeRepository, private carterinhaRepository: CarterinhaRepository) {}

  async execute(data: PostCarterinhaDto, author: string | number): Promise<Carterinha> {
    const municipeExists = await this.municipeRepository.getMunicipeById(
      data.municipe_uuid
    )
    
    if(!municipeExists){
      throw new AppError("Municipe not found", 404, "MUNICIPE_NOT_FOUND");
    }

    const emissao = new Date(Date.now());
    const carterinhaPolicy = new CarterinhaPolicy();
    const validade = carterinhaPolicy.calcularValidade(emissao);

    const newCarterinha = new Carterinha(
      emissao,
      validade,
      data.origem,
      data.atividade || null,
      data.municipe_uuid,
      author
    );

    return await this.carterinhaRepository.postCarterinhas(newCarterinha);
  }
}
