import { FtRelatorioArquivoDto } from "../entities/ft-relatorio-arquivo.entity.js";

export interface FtRelatorioArquivoRepository {
  create(data: Partial<FtRelatorioArquivoDto>): Promise<FtRelatorioArquivoDto>;
  findById(id: string): Promise<FtRelatorioArquivoDto | null>;
  list(page: number, limit: number): Promise<{ rows: FtRelatorioArquivoDto[]; count: number }>;
  claimNext(now: Date, staleBefore: Date): Promise<FtRelatorioArquivoDto | null>;
  complete(id: string, data: Partial<FtRelatorioArquivoDto>): Promise<void>;
  progress(id: string, total: number, generated: number, failed: number): Promise<void>;
  fail(id: string, message: string): Promise<void>;
  retry(id: string): Promise<boolean>;
  reserveDownload(id: string, now: Date): Promise<boolean>;
  releaseDownload(id: string): Promise<void>;
  markDeleted(id: string, now: Date): Promise<void>;
  findExpired(cutoff: Date): Promise<FtRelatorioArquivoDto[]>;
  countPending(): Promise<number>;
}
