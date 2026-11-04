export interface ExpiredEdital {
  id: string;
  name: string;
}

export interface ExpiredParticipation {
  id: string;
  edital_id: string;
}

export interface FtSchedulerRepository {
  findExpiredActiveEditais(now: Date): Promise<ExpiredEdital[]>;
  findExpiredActiveVinculos(now: Date): Promise<ExpiredParticipation[]>;
  concludeExpiredEdital(edital: ExpiredEdital): Promise<{
    editalId: string;
    editalName: string;
    vinculosUpdated: number;
    before: unknown;
    after: unknown;
    vinculos: unknown[];
  }>;
  expireVinculo(vinculo: ExpiredParticipation): Promise<{
    bolsistaId: string;
    vinculoId: string;
    editalId: string;
    before: unknown;
    after: unknown;
  }>;
}
