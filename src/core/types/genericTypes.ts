export type genericResponse = {
    ok: boolean;
    code: number;
    message: string;
}

export interface interfaceErrorResponse extends genericResponse {
    error?: any;
}

export type QueryParams = {
  search?: string;
  page?: number;
  limit?: number;
  order?: string;
  setorId?: number;
  status?: string | string[];
  solicitanteId?: number;
  responsavelId?: number;
  tipo?: string;
  prioridade?: string;
  dateFrom?: string;
  dateTo?: string;
  searchHash?: string;
};
