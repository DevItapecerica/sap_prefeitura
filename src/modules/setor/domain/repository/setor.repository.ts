import { Setor } from "../entity/Setor.js";

export interface SetorRepository {
  findOneSetor(id: number): Promise<Setor | null>;
  findAllSetor(): Promise<Setor[]>;
  createSetor(setor: Pick<Setor, "name" | "description">): Promise<Setor>;
  updateSetor(
    id: number,
    setor: Pick<Setor, "name" | "description">,
  ): Promise<Setor | null>;
  deleteSetor(id: number): Promise<boolean>;
}
