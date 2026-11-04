import Atleta from "../entity/Atleta.js";
import { QueryAtleta, UpdateAtleta } from "../contracts/atleta.js";

export default interface AtletaRepository {
  createAtleta: (atleta: Atleta) => Promise<Atleta>;
  findAllAtletas: (
    query?: QueryAtleta,
  ) => Promise<{ atletas: Atleta[]; count: number }>;
  findOneAtleta: (uuid: string) => Promise<Atleta | null>;
  findActiveByMunicipe: (municipe_uuid: string) => Promise<Atleta | null>;
  addModalidadeToAtleta: (
    atleta_uuid: string,
    modalidade_uuid: string,
  ) => Promise<{ restored: boolean } | null>;
  removeModalidadeFromAtleta: (
    atleta_uuid: string,
    modalidade_uuid: string,
  ) => Promise<boolean>;
  updateAtleta: (uuid: string, data: UpdateAtleta) => Promise<Atleta | null>;
  deleteAtleta: (uuid: string) => Promise<boolean>;
}
