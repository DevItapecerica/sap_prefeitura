import { Setor } from "../../domain/entity/Setor.js";
import { SetorRepository } from "../../domain/repository/setor.repository.js";

export class ListSetoresUseCase {
  constructor(private readonly repository: SetorRepository) {}

  execute(): Promise<Setor[]> {
    return this.repository.findAllSetor();
  }
}
