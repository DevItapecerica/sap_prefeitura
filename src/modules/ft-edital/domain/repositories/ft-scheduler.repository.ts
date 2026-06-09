export interface FtSchedulerRepository {
  findExpiredActiveEditais(now: Date): Promise<any[]>;
  findExpiredActiveVinculos(now: Date): Promise<any[]>;
  concludeExpiredEdital(edital: any): Promise<{
    editalId: string;
    editalName: string;
    bolsistasUpdated: number;
    vinculosUpdated: number;
  }>;
  expireVinculo(vinculo: any): Promise<{
    bolsistaId: string;
    vinculoId: string;
  }>;
}
