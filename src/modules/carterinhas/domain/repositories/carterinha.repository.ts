import Carterinha from "../entity/Carteirinha.js";

export default interface CarterinhaRepository {
    getCarterinhas: () => Promise<{carterinhas: Carterinha[], count: number}>;
    postCarterinhas: (carterinha: Carterinha) => Promise<Carterinha>;
    getCarterinhaById: (id: number) => Promise<Carterinha | null>;
    updateCarterinha: (id: number, carterinha: Carterinha) => Promise<Carterinha | null>;
    deleteCarterinha: (id: number) => Promise<boolean>;
}