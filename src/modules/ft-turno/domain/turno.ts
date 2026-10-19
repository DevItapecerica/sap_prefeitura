export interface TurnoInput {
  nome: string;
  hora_inicio: string;
  hora_fim: string;
}

export interface TurnoQuery {
  page?: string | number;
  limit?: string | number;
  search?: string;
}
