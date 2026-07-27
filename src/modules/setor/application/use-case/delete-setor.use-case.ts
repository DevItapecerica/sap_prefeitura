import AppError from "../../../../core/appError.js";
import { SetorRepository } from "../../domain/repository/setor.repository.js";
import { DeleteSetorResultDto } from "../dto/delete-setor-result.dto.js";

export class DeleteSetorUseCase {
  constructor(private readonly repository: SetorRepository) {}

  async execute(id: number): Promise<DeleteSetorResultDto> {
    if (id === 1) {
      throw new AppError(
        "Não é possível deletar o setor principal",
        403,
        "SETOR_MAIN_DELETE_FORBIDDEN",
      );
    }

    const before = await this.repository.findOneSetor(id);
    if (!before) {
      throw new AppError("Setor não encontrado", 404, "SETOR_NOT_FOUND");
    }

    const deleted = await this.repository.deleteSetor(id);
    if (!deleted) {
      throw new AppError("Setor não encontrado", 404, "SETOR_NOT_FOUND");
    }

    return { before, after: null };
  }
}
