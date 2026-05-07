export type CarterinhaDto = {
  uuid: string;
  emissao: Date;
  validade: Date;
  setor_uuid: string | number;
  atividade_uuid: string | null;
  municipe_uuid: string | number;
  author: string | number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type PostCarterinhaDto = {
  setor_uuid: string;
  atividade_uuid: string | null;
  municipe_uuid: string;
};
