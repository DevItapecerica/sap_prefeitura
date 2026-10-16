export interface FtPaymentInfoDto {
  bco: string;
  ag: string;
  dig_ag: string;
  conta: string;
  dig_conta: string;
}

export interface FtBolsistaDto {
  municipe_uuid: string;
  payment_info: FtPaymentInfoDto;
}

export interface FtBolsistaQueryDto {
  page?: string | number;
  limit?: string | number;
  search?: string;
}

export interface FtBolsistaVinculoCandidatesQueryDto extends FtBolsistaQueryDto {
  edital_id: string;
  data_vinculo: string;
  cursor?: string;
}

export interface FtBolsistaOcorrenciaDto {
  bolsista_edital_id: string;
  data_ocorrencia: string;
  descricao: string;
}

export interface FtBolsistaOcorrenciaQueryDto {
  bolsista_edital_id?: string;
  edital_id?: string;
  page?: string | number;
  limit?: string | number;
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

export interface FtBolsistaCancelamentoDto {
  observacao: string;
}
