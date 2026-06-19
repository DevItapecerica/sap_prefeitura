import { QueryCarterinhaEsporteByMunicipeDto } from "../dto/queryCarterinhaEsporte.dto.js";
import CarterinhaEsporte from "../../domain/entity/CarterinhaEsporte.js";
import CarterinhaEsporteRepository from "../../domain/repositories/carterinha-esporte.repository.js";

export default class ListCarterinhasEsporteByAtletaUseCase {
  constructor(private carterinhaRepository: CarterinhaEsporteRepository) {}

  async execute(
    query: QueryCarterinhaEsporteByMunicipeDto,
  ): Promise<{ carterinhas: CarterinhaEsporte[]; count: number }> {
    return this.carterinhaRepository.listByMunicipe(query);
  }
}
