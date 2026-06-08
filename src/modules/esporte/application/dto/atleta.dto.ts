export type CreateAtletaDto = {
  municipe_uuid: string;
  ativo?: boolean;
};

export type UpdateAtletaDto = {
  ativo?: boolean;
};

export type QueryAtletaDto = {
  search?: string;
  ativo?: boolean | string;
  municipe_uuid?: string;
  page?: number;
  limit?: number;
  order?: string;
};
