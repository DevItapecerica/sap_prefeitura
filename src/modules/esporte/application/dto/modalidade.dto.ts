export type CreateModalidadeDto = {
  nome: string;
};

export type UpdateModalidadeDto = {
  nome?: string;
};

export type QueryModalidadeDto = {
  search?: string;
  page?: number;
  limit?: number;
  order?: string;
};
