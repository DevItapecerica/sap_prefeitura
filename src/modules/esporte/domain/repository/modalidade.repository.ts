import {
  QueryModalidadeDto,
  UpdateModalidadeDto,
} from "../../application/dto/modalidade.dto.js";
import Modalidade from "../entity/Modalidade.js";

export default interface ModalidadeRepository {
  createModalidade: (modalidade: Modalidade) => Promise<Modalidade>;
  findAllModalidades: (
    query?: QueryModalidadeDto,
  ) => Promise<{ modalidades: Modalidade[]; count: number }>;
  findOneModalidade: (uuid: string) => Promise<Modalidade | null>;
  findByNome: (nome: string) => Promise<Modalidade | null>;
  updateModalidade: (
    uuid: string,
    data: UpdateModalidadeDto,
  ) => Promise<Modalidade | null>;
  deleteModalidade: (uuid: string) => Promise<boolean>;
}
