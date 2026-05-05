import { QueryParams } from "../../../../core/shared/types/genericTypes.js";
import { Setor } from "../entity/Setor.js";

export interface SetorRepository {
    findOneSetor(id: number | string): Promise<Setor | null>;
    findAllSetor(query?: QueryParams): Promise<Setor[]>;
    createSetor(setor: any): Promise<Setor>;
    updateSetor(id: number, setor: any): Promise<Setor | null>;
    deleteSetor(id: number): Promise<Boolean>;
}