export type QueryCarterinhaEsporte = {
  limit?: number;
  page?: number;
  order?: string;
  modalidade?: string;
};

export type QueryCarterinhaEsporteByMunicipe = QueryCarterinhaEsporte & {
  municipe_uuid: string;
};
