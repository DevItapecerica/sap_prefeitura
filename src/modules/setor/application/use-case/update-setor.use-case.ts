import AppError from "../../../../core/appError.js";
import { SetorRepository } from "../../domain/repository/setor.repository.js";
import { UpdateSetorDto } from "../dto/update-setor.dto.js";
import { UpdateSetorResultDto } from "../dto/update-setor-result.dto.js";

export class UpdateSetorUseCase {
  constructor(private readonly repository: SetorRepository) {}

  async execute(
    id: number,
    data: UpdateSetorDto,
  ): Promise<UpdateSetorResultDto> {
    const before = await this.repository.findOneSetor(id);
    if (!before) {
      throw new AppError("Setor não encontrado", 404, "SETOR_NOT_FOUND");
    }

    const after = await this.repository.updateSetor(id, data);
    if (!after) {
      throw new AppError("Setor não encontrado", 404, "SETOR_NOT_FOUND");
    }

    return { before, after };
  }
}
