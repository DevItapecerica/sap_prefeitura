import { BolsistaQueryDto } from "../../application/dto/bolsista-query.dto.js";

export interface IBolsistaRepository {
    save(bolsista: any): Promise<any>;
    findById(id: string | number): Promise<any>;
    findAll(query: BolsistaQueryDto): Promise<any>;
    update(id: string | number, bolsista: any): Promise<any>;
    delete(id: string | number): Promise<boolean>;
}