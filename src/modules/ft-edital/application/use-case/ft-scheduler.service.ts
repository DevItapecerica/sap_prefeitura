import { FtSchedulerRepository } from "../../domain/repositories/ft-scheduler.repository.js";
import { makeFtEditalEventPublisher } from "../../factories/ft-edital-events.factory.js";
import { FT_EDITAL_EVENTS } from "../events/ft-edital.events.js";
import { ApplicationEventContext } from "../../../../core/event/application-event.js";

const makeSchedulerContext = (now: Date): ApplicationEventContext => ({
  correlationId: `ft-scheduler-${now.toISOString()}`,
  actor: { id: "system", name: "FT scheduler" },
  origin: { type: "SCHEDULER", route: "ft-scheduler" },
});

export type FtSchedulerRunResult = {
  editaisInativados: number;
  vinculosConcluidos: number;
  vinculosExpirados: number;
};

export class FtSchedulerService {
  constructor(
    private readonly repository: FtSchedulerRepository,
    private readonly eventPublisher = makeFtEditalEventPublisher(),
  ) {}

  async run(
    now = new Date(),
    context?: ApplicationEventContext,
  ): Promise<FtSchedulerRunResult> {
    const result: FtSchedulerRunResult = {
      editaisInativados: 0,
      vinculosConcluidos: 0,
      vinculosExpirados: 0,
    };

    const expiredEditais = await this.repository.findExpiredActiveEditais(now);

    for (const edital of expiredEditais) {
      const updated = await this.repository.concludeExpiredEdital(edital);

      result.editaisInativados += 1;
      result.vinculosConcluidos += updated.vinculosUpdated;
      await this.eventPublisher.publish(FT_EDITAL_EVENTS.editalConcluded, {
        context: context ?? makeSchedulerContext(now),
        editalId: updated.editalId,
        before: updated.before,
        after: updated.after,
        vinculos: updated.vinculos,
      });
    }

    const expiredVinculos = await this.repository.findExpiredActiveVinculos(now);

    for (const vinculo of expiredVinculos) {
      const updated = await this.repository.expireVinculo(vinculo);
      result.vinculosExpirados += 1;
      await this.eventPublisher.publish(FT_EDITAL_EVENTS.vinculoExpired, {
        context: context ?? makeSchedulerContext(now),
        editalId: updated.editalId,
        bolsistaId: updated.bolsistaId,
        vinculoId: updated.vinculoId,
        before: updated.before,
        after: updated.after,
      });
    }

    return result;
  }
}
