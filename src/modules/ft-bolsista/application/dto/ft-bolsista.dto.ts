export interface FtPaymentInfoDto {
  bco: string;
  pagador_id: string;
  ag: string;
  dig_ag: string;
  conta: string;
  dig_conta: string;
}

export interface FtBolsistaDto {
  nome: string;
  cpf: string;
  telefone?: string | null;
  local: string;
  cep: string;
  numero: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  payment_info: FtPaymentInfoDto;
}

export interface FtBolsistaQueryDto {
  page?: string | number;
  limit?: string | number;
  search?: string;
}

export interface FtBolsistaFaltaDto {
  edital_id: string;
  data_falta: string;
  observacao?: string | null;
}

export interface FtBolsistaFaltaQueryDto {
  edital_id?: string;
  data_inicio?: string;
  data_fim?: string;
  page?: string | number;
  limit?: string | number;
}

export interface FtBolsistaProrrogacaoDto {
  bolsista_id: string;
  edital_id: string;
}
