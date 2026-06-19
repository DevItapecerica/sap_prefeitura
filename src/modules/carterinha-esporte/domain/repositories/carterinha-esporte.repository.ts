import {
  QueryCarterinhaEsporteByMunicipeDto,
  QueryCarterinhaEsporteDto,
} from "../../application/dto/queryCarterinhaEsporte.dto.js";
import CarterinhaEsporte from "../entity/CarterinhaEsporte.js";

export default interface CarterinhaEsporteRepository {
  list: (
    query: QueryCarterinhaEsporteDto,
  ) => Promise<{ carterinhas: CarterinhaEsporte[]; count: number }>;
  listByMunicipe: (
    query: QueryCarterinhaEsporteByMunicipeDto,
  ) => Promise<{ carterinhas: CarterinhaEsporte[]; count: number }>;
  create: (carterinha: CarterinhaEsporte) => Promise<CarterinhaEsporte>;
  findById: (id: string) => Promise<CarterinhaEsporte | null>;
}
