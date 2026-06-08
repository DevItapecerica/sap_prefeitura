import {
  FtBolsistaFaltaQueryDto,
  FtBolsistaQueryDto,
} from "../../application/dto/ft-bolsista.dto.js";

export interface FtBolsistaRepository {
  findById(id: string): Promise<any | null>;
  findByCpf(cpf: string): Promise<any | null>;
  create(data: any): Promise<any>;
  createPaymentInfo(data: any): Promise<any>;
  findAndCount(query?: FtBolsistaQueryDto): Promise<{ count: number; rows: any[] }>;
  countActiveByPagador(pagadorId: string): Promise<number>;
  findToExpire(limitDate: Date): Promise<{ count: number; rows: any[] }>;
  findByEditalId(editalId: string): Promise<any[]>;
  findEditalById(editalId: string): Promise<any | null>;
  findVinculo(
    bolsistaId: string,
    editalId: string,
    status?: string,
  ): Promise<any | null>;
  createFalta(data: any): Promise<any>;
  findFaltaById(id: string): Promise<any | null>;
  findAndCountFaltasByBolsista(
    bolsistaId: string,
    query?: FtBolsistaFaltaQueryDto,
  ): Promise<{ count: number; rows: any[] }>;
}
