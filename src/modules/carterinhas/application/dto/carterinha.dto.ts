export type CarterinhaDto = {
  uuid: string;
  emissao: Date;
  validade: Date;
  origem: string;
  atividade_uuid: string | null;
  municipe_uuid: string | number;
  author: string | number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type PostCarterinhaDto = {
  origem: string;
  atividade_uuid: string | null;
  municipe_uuid: string;
};
