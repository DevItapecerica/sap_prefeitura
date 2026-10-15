import {
  FtBolsistaFaltaQueryDto,
  FtBolsistaQueryDto,
  FtBolsistaVinculoCandidatesQueryDto,
} from "../../application/dto/ft-bolsista.dto.js";

export interface FtBolsistaRepository {
  findById(id: string): Promise<any | null>;
  findByMunicipeUuid(municipeUuid: string): Promise<any | null>;
  findMunicipeById(municipeUuid: string): Promise<any | null>;
  create(data: any): Promise<any>;
  createPaymentInfo(data: any): Promise<any>;
  createWithPaymentInfo(
    bolsistaData: { municipe_uuid: string },
    paymentInfoData: any,
  ): Promise<{ bolsista: any; paymentInfo: any }>;
  updateWithPaymentInfo(
    bolsista: any,
    paymentInfo: any,
    paymentInfoData: any,
  ): Promise<any>;
  findAndCount(query?: FtBolsistaQueryDto): Promise<{ count: number; rows: any[] }>;
  findAndCountVinculoCandidates(
    query: FtBolsistaVinculoCandidatesQueryDto,
  ): Promise<{ count: number; rows: any[] }>;
  findAniversariantesAtivos(): Promise<any[]>;
  findToExpire(limitDate: Date): Promise<{ count: number; rows: any[] }>;
  findByEditalId(editalId: string): Promise<any[]>;
  findHistoricoByBolsistaId(bolsistaId: string): Promise<any[]>;
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
  cancelVinculo(bolsista: any, vinculo: any, observacao: string): Promise<void>;
  prorrogateVinculos(vinculos: any[]): Promise<void>;
  createFalta(data: any): Promise<any>;
  findFaltaById(id: string): Promise<any | null>;
  destroyFalta(falta: any): Promise<void>;
  findAndCountFaltasByBolsista(
    bolsistaId: string,
    query?: FtBolsistaFaltaQueryDto,
  ): Promise<{ count: number; rows: any[] }>;
  findFaltasByBolsistaPeriodo(
    bolsistaId: string,
    editalId: string,
    dataInicio: string,
    dataFim: string,
  ): Promise<any[]>;
  createOcorrencia(data: any): Promise<any>;
  findOcorrenciaById(id: string): Promise<any | null>;
  destroyOcorrencia(ocorrencia: any): Promise<void>;
  findAndCountOcorrenciasByBolsista(
    bolsistaId: string,
    query?: import("../../application/dto/ft-bolsista.dto.js").FtBolsistaOcorrenciaQueryDto,
  ): Promise<{ count: number; rows: any[] }>;
}
