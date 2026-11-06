export type CreateModalidade = {
  nome: string;
};

export type UpdateModalidade = {
  nome?: string;
};

export type QueryModalidade = {
  search?: string;
  page?: number;
  limit?: number;
  order?: string;
};
