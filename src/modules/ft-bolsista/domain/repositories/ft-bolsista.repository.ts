import {
  FtBolsistaFaltaQueryDto,
  FtBolsistaQueryDto,
} from "../../application/dto/ft-bolsista.dto.js";

export interface FtBolsistaRepository {
  findById(id: string): Promise<any | null>;
  findByCpf(cpf: string): Promise<any | null>;
  create(data: any): Promise<any>;
  createPaymentInfo(data: any): Promise<any>;
  createWithPaymentInfo(
    bolsistaData: any,
    paymentInfoData: any,
  ): Promise<{ bolsista: any; paymentInfo: any }>;
  updateWithPaymentInfo(
    bolsista: any,
    bolsistaData: any,
    paymentInfo: any,
    paymentInfoData: any,
  ): Promise<any>;
  findAndCount(query?: FtBolsistaQueryDto): Promise<{ count: number; rows: any[] }>;
  findAndCountVinculoCandidates(
    query?: FtBolsistaQueryDto,
  ): Promise<{ count: number; rows: any[] }>;
  countActiveByPagador(pagadorId: string): Promise<number>;
  findToExpire(limitDate: Date): Promise<{ count: number; rows: any[] }>;
  findByEditalId(editalId: string): Promise<any[]>;
  findEditalById(editalId: string): Promise<any | null>;
  findVinculo(
    bolsistaId: string,
    editalId: string,
    status?: string,
  ): Promise<any | null>;
  findFaltaByBolsistaEditalData(
    bolsistaId: string,
    editalId: string,
    dataFalta: string | Date,
  ): Promise<any | null>;
  destroyBolsista(bolsista: any): Promise<void>;
  cancelVinculo(bolsista: any, vinculo: any): Promise<void>;
  prorrogateVinculos(vinculos: any[]): Promise<void>;
  createFalta(data: any): Promise<any>;
  findFaltaById(id: string): Promise<any | null>;
  destroyFalta(falta: any): Promise<void>;
  findAndCountFaltasByBolsista(
    bolsistaId: string,
    query?: FtBolsistaFaltaQueryDto,
  ): Promise<{ count: number; rows: any[] }>;
}
