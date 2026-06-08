import Atleta from "../entity/Atleta.js";
import { QueryAtletaDto, UpdateAtletaDto } from "../../application/dto/atleta.dto.js";

export default interface AtletaRepository {
  createAtleta: (atleta: Atleta) => Promise<Atleta>;
  findAllAtletas: (query?: QueryAtletaDto) => Promise<{ atletas: Atleta[]; count: number }>;
  findOneAtleta: (uuid: string) => Promise<Atleta | null>;
  findActiveByMunicipe: (municipe_uuid: string) => Promise<Atleta | null>;
  updateAtleta: (uuid: string, data: UpdateAtletaDto) => Promise<Atleta | null>;
  deleteAtleta: (uuid: string) => Promise<boolean>;
}
