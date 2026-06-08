import { FtEditalBolsistaQueryDto } from "../../application/dto/ft-edital.dto.js";

export interface FtEditalRepository {
  findAll(): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  create(data: any): Promise<any>;
  findBolsistaById(id: string): Promise<any | null>;
  countActiveByPagador(pagadorId: string): Promise<number>;
  findAllWithBolsista(): Promise<any[]>;
  findBolsistasByEdital(
    id: string,
    query?: FtEditalBolsistaQueryDto,
    optionWhere?: any,
  ): Promise<any[]>;
  countBolsistasByEdital(
    id: string,
    query?: FtEditalBolsistaQueryDto,
    optionWhere?: any,
  ): Promise<number>;
  findToRelatory(id: string): Promise<any[]>;
}
