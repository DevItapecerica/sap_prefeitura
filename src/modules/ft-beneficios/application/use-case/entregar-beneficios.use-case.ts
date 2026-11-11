import AppError from "../../../../core/appError.js";
import type {
  BenefitUnitOfWork,
  BenefitActor,
  BenefitDelivery,
} from "../../domain/beneficios.contracts.js";
import { BeneficiosPolicy } from "../../domain/beneficios.policy.js";
import { BeneficiosMapper } from "../mapper/beneficios.mapper.js";
import {
  executeBenefitOperation,
  requiredProgram,
  requiredParticipation,
} from "../utils/beneficios-errors.js";

export class EntregarBeneficiosUseCase {
  constructor(
    private readonly unit: BenefitUnitOfWork,
    private readonly policy: BeneficiosPolicy,
    private readonly mapper: BeneficiosMapper,
    private readonly clock: () => Date = () => new Date(),
  ) {}
  execute(
    id: string,
    participationId: string,
    input: { operacao_id: string; beneficio_ids: string[] },
    actor: BenefitActor,
  ) {
    return executeBenefitOperation(() =>
      this.unit.run(async (ports) => {
        const edital = requiredProgram(await ports.lockEdital(id));
        const ids = [...input.beneficio_ids].sort((a, b) => a.localeCompare(b));
        const signature = JSON.stringify([
          "entregar",
          id,
          participationId,
          ids,
          String(actor.id),
        ]);
        const previous = await ports.operation(input.operacao_id);
        if (previous) {
          if (previous.assinatura !== signature)
            throw new AppError(
              "Operação já utilizada com outros dados.",
              409,
              "BENEFIT_OPERATION_CONFLICT",
            );
          return this.mapper.operationResult(previous.resultado);
        }
        const { participacao: p } = requiredParticipation(
          await ports.lockParticipation(id, participationId),
        );
        const now = this.clock(),
          month = this.policy.currentMonth(now);
        this.policy.assertEligible(edital, p, month, now);
        const items = this.policy.selectBenefits(
          await ports.benefits(id),
          ids,
          await ports.currentDeliveries(id, p.pessoa_id, month),
        );
        const delivery: BenefitDelivery = {
          id: ports.newId(),
          edital_id: id,
          participacao_id: p.id,
          pessoa_id: p.pessoa_id,
          mes: month,
          entregue_em: now.toISOString(),
          autor_id: String(actor.id),
          responsavel: await ports.actorName(actor.id),
          estornado_em: null,
          estornado_por: null,
          responsavel_estorno: null,
          motivo_estorno: null,
          itens: items,
        };
        await ports.create(delivery);
        await ports.audit({
          actor: { userId: actor.id },
          action: "CREATE",
          module: "ft-beneficios",
          resourceType: "entrega_beneficios",
          resourceId: delivery.id,
          result: "SUCCESS",
          requestId: actor.requestId,
          metadata: {
            mes: month,
            beneficios: ids,
            operacao_id: input.operacao_id,
          },
        });
        await ports.remember(
          input.operacao_id,
          id,
          signature,
          await this.mapper.operationSnapshot(delivery),
        );
        return delivery;
      }),
    );
  }
}
