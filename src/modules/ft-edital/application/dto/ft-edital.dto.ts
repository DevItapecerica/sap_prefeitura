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

export interface FtEditalRelatoryQueryDto {
  data_inicio?: string;
  data_fim?: string;
}

export interface FtVincularBolsistaDto {
  bolsista: string[];
  data_vinculo?: string | Date;
}
