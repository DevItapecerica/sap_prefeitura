export type QueryCarterinhasDto = {
    limit?: number;
    page?: number;
    order?: string;
    origem?: string;
    servico?: string;
};

export type QueryCarterinhasByMunicipeDto = QueryCarterinhasDto & {
    municipe_uuid: string;
};
