import { FtSchedulerRepository } from "../../domain/repositories/ft-scheduler.repository.js";

export type FtSchedulerRunResult = {
  editaisInativados: number;
  bolsistasInativados: number;
  vinculosConcluidos: number;
  vinculosExpirados: number;
};

export class FtSchedulerService {
  constructor(private readonly repository: FtSchedulerRepository) {}

  async run(now = new Date()): Promise<FtSchedulerRunResult> {
    const result: FtSchedulerRunResult = {
      editaisInativados: 0,
      bolsistasInativados: 0,
      vinculosConcluidos: 0,
      vinculosExpirados: 0,
    };

    const expiredEditais = await this.repository.findExpiredActiveEditais(now);

    for (const edital of expiredEditais) {
      const updated = await this.repository.concludeExpiredEdital(edital);

      result.editaisInativados += 1;
      result.bolsistasInativados += updated.bolsistasUpdated;
      result.vinculosConcluidos += updated.vinculosUpdated;
    }

    const expiredVinculos = await this.repository.findExpiredActiveVinculos(now);

    for (const vinculo of expiredVinculos) {
      await this.repository.expireVinculo(vinculo);
      result.vinculosExpirados += 1;
      result.bolsistasInativados += 1;
    }

    return result;
  }
}
