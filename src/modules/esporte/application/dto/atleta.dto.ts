export type CreateAtletaDto = {
  municipe_uuid: string;
  ativo?: boolean;
};

export type UpdateAtletaDto = {
  ativo?: boolean;
};

export type AddModalidadeAtletaDto = {
  modalidade_uuid: string;
};

export type CreateCarteirinhaAtletaDto = {
  observacao?: string | null;
  validade_exame?: string | null;
};

export type QueryAtletaDto = {
  search?: string;
  searchHash?: string;
  ativo?: boolean | string;
  municipe_uuid?: string;
  page?: number;
  limit?: number;
  order?: string;
};
