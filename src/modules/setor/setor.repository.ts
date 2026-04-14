import { QueryParams } from "../../core/shared/types/genericTypes.js";
import { Setor } from "./setor.entity.js";

export interface SetorRepository {
    findOneSetor(id: number): Promise<Setor | null>;
    findAllSetor(query?: QueryParams): Promise<Setor[]>;
    createSetor(setor: any): Promise<Setor>;
    updateSetor(id: number, setor: any): Promise<Setor | null>;
    deleteSetor(id: number): Promise<Boolean>;
}