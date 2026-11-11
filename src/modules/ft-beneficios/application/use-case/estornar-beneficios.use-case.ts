import AppError from "../../../../core/appError.js";
import type {
  BenefitUnitOfWork,
  BenefitActor,
} from "../../domain/beneficios.contracts.js";
import { BeneficiosPolicy } from "../../domain/beneficios.policy.js";
import { BeneficiosMapper } from "../mapper/beneficios.mapper.js";
import {
  executeBenefitOperation,
  requiredProgram,
  requiredParticipation,
} from "../utils/beneficios-errors.js";

export class EstornarBeneficiosUseCase {
  constructor(
    private readonly unit: BenefitUnitOfWork,
    private readonly policy: BeneficiosPolicy,
    private readonly mapper: BeneficiosMapper,
    private readonly clock: () => Date = () => new Date(),
  ) {}
  execute(
    id: string,
    deliveryId: string,
    input: { operacao_id: string; motivo: string },
    actor: BenefitActor,
  ) {
    return executeBenefitOperation(() =>
      this.unit.run(async (ports) => {
        requiredProgram(await ports.lockEdital(id));
        const reason = this.policy.reversalReason(input.motivo);
        const signature = JSON.stringify([
          "estornar",
          id,
          deliveryId,
          reason,
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
        const delivery = await ports.delivery(id, deliveryId);
        if (!delivery)
          throw new AppError(
            "Entrega não encontrada neste edital.",
            404,
            "BENEFIT_DELIVERY_NOT_FOUND",
          );
        requiredParticipation(
          await ports.lockParticipation(id, delivery.participacao_id),
        );
        this.policy.assertReversible(delivery);
        const reversed = {
          ...delivery,
          estornado_em: this.clock().toISOString(),
          estornado_por: String(actor.id),
          responsavel_estorno: await ports.actorName(actor.id),
          motivo_estorno: reason,
        };
        await ports.reverse(reversed);
        await ports.audit({
          actor: { userId: actor.id },
          action: "UPDATE",
          module: "ft-beneficios",
          resourceType: "entrega_beneficios",
          resourceId: deliveryId,
          result: "SUCCESS",
          requestId: actor.requestId,
          metadata: { motivo: reason, operacao_id: input.operacao_id },
        });
        await ports.remember(
          input.operacao_id,
          id,
          signature,
          await this.mapper.operationSnapshot(reversed),
        );
        return reversed;
      }),
    );
  }
}
