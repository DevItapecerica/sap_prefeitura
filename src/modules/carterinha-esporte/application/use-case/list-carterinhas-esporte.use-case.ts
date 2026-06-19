import { QueryCarterinhaEsporteDto } from "../dto/queryCarterinhaEsporte.dto.js";
import CarterinhaEsporte from "../../domain/entity/CarterinhaEsporte.js";
import CarterinhaEsporteRepository from "../../domain/repositories/carterinha-esporte.repository.js";

export default class ListCarterinhasEsporteUseCase {
  constructor(private carterinhaRepository: CarterinhaEsporteRepository) {}

  async execute(
    query: QueryCarterinhaEsporteDto,
  ): Promise<{ carterinhas: CarterinhaEsporte[]; count: number }> {
    return this.carterinhaRepository.list(query);
  }
}
