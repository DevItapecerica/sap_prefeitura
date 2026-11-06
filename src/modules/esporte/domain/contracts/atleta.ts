export type CreateAtleta = {
  municipe_uuid: string;
  ativo?: boolean;
};

export type UpdateAtleta = {
  ativo?: boolean;
};

export type AddModalidadeAtleta = {
  modalidade_uuid: string;
};

export type CreateCarteirinhaAtleta = {
  observacao?: string | null;
  validade_exame?: string | null;
  foto?: string | null;
};

export type QueryAtleta = {
  search?: string;
  searchHash?: string;
  ativo?: boolean | string;
  municipe_uuid?: string;
  page?: number;
  limit?: number;
  order?: string;
};
