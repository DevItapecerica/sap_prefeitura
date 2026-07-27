import AppError from "../../../../core/appError.js";
import { Setor } from "../../domain/entity/Setor.js";
import { SetorRepository } from "../../domain/repository/setor.repository.js";

export class GetSetorByIdUseCase {
  constructor(private readonly repository: SetorRepository) {}

  async execute(id: number): Promise<Setor> {
    const setor = await this.repository.findOneSetor(id);
    if (!setor) {
      throw new AppError("Setor não encontrado", 404, "SETOR_NOT_FOUND");
    }
    return setor;
  }
}
