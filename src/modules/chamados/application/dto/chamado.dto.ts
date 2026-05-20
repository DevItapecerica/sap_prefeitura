import { ChamadoStatus, ChamadoTipo, ChamadoPrioridade } from "../../domain/entity/Chamado.js";

export interface CreateChamadoDto {
  patrimonio: string;
  tipo: ChamadoTipo;
  setorId: number;
  solicitanteId: number | string;
  descricao: string;
  prioridade: ChamadoPrioridade;
  responsavelId?: number | string | null;
  observacoes?: string | null;
}

export interface UpdateChamadoDto {
  status?: ChamadoStatus;
  responsavelId?: number | string | null;
  observacoes?: string | null;
  dataResolucao?: Date | null;
  prioridade?: ChamadoPrioridade;
}

export interface ListChamadoDto {
  status?: ChamadoStatus;
  setorId?: number;
  solicitanteId?: string;
  responsavelId?: string;
  tipo?: ChamadoTipo;
  prioridade?: ChamadoPrioridade;
}
