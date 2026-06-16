export type CarterinhaDto = {
  uuid: string;
  emissao: Date;
  validade: Date;
  origem: string;
  atividade: string | null;
  municipe_uuid: string | number;
  author: string | number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type PostCarterinhaDto = {
  origem: string;
  atividade: string | null;
  municipe_uuid: string;
};
