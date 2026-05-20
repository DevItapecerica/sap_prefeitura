import { QueryParams } from "../../../../core/types/genericTypes.js";
import { Chamado } from "../entity/Chamado.js";

export interface ChamadoRepository {
  findOneChamado(id: string): Promise<Chamado | null>;
  findAllChamado(query?: QueryParams): Promise<Chamado[]>;
  createChamado(chamado: Chamado): Promise<Chamado>;
  updateChamado(id: string, chamado: Partial<Chamado>): Promise<Chamado | null>;
  deleteChamado(id: string): Promise<boolean>;
}
