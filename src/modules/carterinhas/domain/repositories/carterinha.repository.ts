import { QueryCarterinhasDto } from "../../application/dto/queryCarterinhas.dto.js";
import Carterinha from "../entity/Carteirinha.js";

export default interface CarterinhaRepository {
    getCarterinhas: (query: QueryCarterinhasDto) => Promise<{carterinhas: Carterinha[], count: number}>;
    postCarterinhas: (carterinha: Carterinha) => Promise<Carterinha>;
    getCarterinhaById: (id: number) => Promise<Carterinha | null>;
    updateCarterinha: (id: number, carterinha: Carterinha) => Promise<Carterinha | null>;
    deleteCarterinha: (id: number) => Promise<boolean>;
}