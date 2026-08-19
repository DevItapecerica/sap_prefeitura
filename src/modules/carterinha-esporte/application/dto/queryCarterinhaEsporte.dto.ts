export type QueryCarterinhaEsporteDto = {
  limit?: number;
  page?: number;
  order?: string;
  modalidade?: string;
};

export type QueryCarterinhaEsporteByMunicipeDto =
  QueryCarterinhaEsporteDto & {
    municipe_uuid: string;
  };
