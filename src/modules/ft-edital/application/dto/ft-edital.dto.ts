export interface FtEditalDto {
  name: string;
  data_publicacao: string | Date;
  data_vencimento: string | Date;
  dia_pagamento: number;
  valor_bolsa: number | string;
}

export interface FtEditalQueryDto {
  page?: string | number;
  limit?: string | number;
  search?: string;
  order?: string;
}

export interface FtEditalBolsistaQueryDto {
  page?: string | number;
  limit?: string | number;
  search?: string;
}

export interface FtVincularBolsistaDto {
  bolsistas: Array<{ bolsista_id: string; local: string; pagador_id: string; turno_id: string }>;
  data_vinculo?: string | Date;
}

export interface FtAtualizarVinculoDto {
  local: string;
  pagador_id: string;
  turno_id: string;
}
