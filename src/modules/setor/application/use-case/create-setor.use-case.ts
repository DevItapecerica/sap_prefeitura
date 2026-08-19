import { Setor } from "../../domain/entity/Setor.js";
import { SetorRepository } from "../../domain/repository/setor.repository.js";
import { CreateSetorDto } from "../dto/create-setor.dto.js";

export class CreateSetorUseCase {
  constructor(private readonly repository: SetorRepository) {}

  execute(data: CreateSetorDto): Promise<Setor> {
    return this.repository.createSetor(data);
  }
}
