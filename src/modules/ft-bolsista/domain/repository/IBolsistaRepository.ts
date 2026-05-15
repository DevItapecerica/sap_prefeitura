import { BolsistaQueryDto } from "../../application/dto/bolsista-query.dto.js";
import { bolsistaDto } from "../../application/dto/bolsista.dto.js";
import { Bolsista } from "../entity/Bolsista.js";

export interface IBolsistaRepository {
    save(bolsista: bolsistaDto): Promise<Bolsista>;
    findById(id: string | number): Promise<Bolsista | null>;
    findAll(query: BolsistaQueryDto): Promise<{bolsistas: Bolsista[], count: number}>;
    update(id: string | number, bolsista: any): Promise<Bolsista | null>;
    delete(id: string | number): Promise<boolean>;
}