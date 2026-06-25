import {
  FtEditalBolsistaQueryDto,
  FtEditalRelatoryQueryDto,
} from "../../application/dto/ft-edital.dto.js";

export interface FtEditalRepository {
  findAll(): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  create(data: any): Promise<any>;
  update(edital: any, data: any): Promise<any>;
  destroy(edital: any): Promise<void>;
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
  findToRelatory(id: string, periodo: Required<FtEditalRelatoryQueryDto>): Promise<any[]>;
  vincularBolsistas(
    edital: any,
    bolsistas: Array<{ bolsista: any; data_vinculo?: string | Date }>,
  ): Promise<void>;
}
