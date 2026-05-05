import Carterinha from "../../domain/entity/Carteirinha.js";
import CarterinhaRepository from "../../domain/repositories/carterinha.repository.js";
import { QueryCarterinhasDto } from "../dto/queryCarterinhas.dto.js";

export default class GetCarterinhaUseCase {
  constructor(private carterinhaRepository: CarterinhaRepository) {}

  async execute(query: QueryCarterinhasDto): Promise<{carterinhas: Carterinha[], count: number}> {
    const carterinhaCriptografedawait = this.carterinhaRepository.getCarterinhas(query);

    return carterinhaCriptografedawait;
  }
}
