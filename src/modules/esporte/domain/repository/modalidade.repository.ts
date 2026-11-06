import { QueryModalidade, UpdateModalidade } from "../contracts/modalidade.js";
import Modalidade from "../entity/Modalidade.js";

export default interface ModalidadeRepository {
  createModalidade: (modalidade: Modalidade) => Promise<Modalidade>;
  findAllModalidades: (
    query?: QueryModalidade,
  ) => Promise<{ modalidades: Modalidade[]; count: number }>;
  findOneModalidade: (uuid: string) => Promise<Modalidade | null>;
  findByNome: (nome: string) => Promise<Modalidade | null>;
  updateModalidade: (
    uuid: string,
    data: UpdateModalidade,
  ) => Promise<Modalidade | null>;
  deleteModalidade: (uuid: string) => Promise<boolean>;
}
