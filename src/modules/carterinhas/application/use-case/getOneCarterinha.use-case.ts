import { AppError } from "../../../../core/appError.js";
import Carterinha from "../../domain/entity/Carteirinha.js";
import CarterinhaRepository from "../../domain/repositories/carterinha.repository.js";

export default class GetOneCarterinhaUseCase {
  constructor(private carterinhaRepository: CarterinhaRepository) {}

  async execute(uuid: number | string): Promise<Carterinha> {
    const carterinha = await this.carterinhaRepository.getCarterinhaById(uuid);

    if (!carterinha) {
      throw new AppError("Carterinha not found", 404, "CARTERINHA_NOT_FOUND");
    }

    return carterinha;
  }
}
