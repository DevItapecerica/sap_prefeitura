import Carterinha from "../../domain/entity/Carteirinha.js";
import CarterinhaRepository from "../../domain/repositories/carterinha.repository.js";
import { QueryCarterinhasByMunicipeDto } from "../dto/queryCarterinhas.dto.js";

export default class GetCarterinhasByMunicipeUseCase {
  constructor(private carterinhaRepository: CarterinhaRepository) {}

  async execute(
    query: QueryCarterinhasByMunicipeDto,
  ): Promise<{ carterinhas: Carterinha[]; count: number }> {
    return this.carterinhaRepository.getCarterinhasByMunicipe(query);
  }
}
