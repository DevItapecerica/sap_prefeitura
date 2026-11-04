export interface FtPaymentInfo {
  bco: string;
  ag: string;
  dig_ag: string;
  conta: string;
  dig_conta: string;
}

export interface FtBolsista {
  municipe_uuid: string;
  payment_info: FtPaymentInfo;
}

export interface FtBolsistaQuery {
  page?: string | number;
  limit?: string | number;
  search?: string;
}

export interface FtBolsistaVinculoCandidatesQuery extends FtBolsistaQuery {
  edital_id: string;
  data_vinculo: string;
  cursor?: string;
}

export interface FtBolsistaOcorrencia {
  bolsista_edital_id: string;
  data_ocorrencia: string;
  descricao: string;
}

export interface FtBolsistaOcorrenciaQuery {
  bolsista_edital_id?: string;
  edital_id?: string;
  page?: string | number;
  limit?: string | number;
}

export interface FtBolsistaFalta {
  edital_id: string;
  data_falta: string;
  observacao?: string | null;
}

export interface FtBolsistaFaltaQuery {
  edital_id?: string;
  data_inicio?: string;
  data_fim?: string;
  page?: string | number;
  limit?: string | number;
}

export interface FtBolsistaProrrogacao {
  bolsista_id: string;
  edital_id: string;
}

export interface FtBolsistaCancelamento {
  observacao: string;
}
