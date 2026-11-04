import {
  QueryCarterinhaEsporteByMunicipe,
  QueryCarterinhaEsporte,
} from "../contracts/queryCarterinhaEsporte.js";
import CarterinhaEsporte from "../entity/CarterinhaEsporte.js";

export default interface CarterinhaEsporteRepository {
  list: (
    query: QueryCarterinhaEsporte,
  ) => Promise<{ carterinhas: CarterinhaEsporte[]; count: number }>;
  listByMunicipe: (
    query: QueryCarterinhaEsporteByMunicipe,
  ) => Promise<{ carterinhas: CarterinhaEsporte[]; count: number }>;
  create: (carterinha: CarterinhaEsporte) => Promise<CarterinhaEsporte>;
  findById: (id: string) => Promise<CarterinhaEsporte | null>;
}
