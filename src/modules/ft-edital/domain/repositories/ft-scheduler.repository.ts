export interface FtSchedulerRepository {
  findExpiredActiveEditais(now: Date): Promise<any[]>;
  findExpiredActiveVinculos(now: Date): Promise<any[]>;
  concludeExpiredEdital(edital: any): Promise<{
    editalId: string;
    editalName: string;
    vinculosUpdated: number;
    before: unknown;
    after: unknown;
    vinculos: unknown[];
  }>;
  expireVinculo(vinculo: any): Promise<{
    bolsistaId: string;
    vinculoId: string;
    editalId: string;
    before: unknown;
    after: unknown;
  }>;
}
