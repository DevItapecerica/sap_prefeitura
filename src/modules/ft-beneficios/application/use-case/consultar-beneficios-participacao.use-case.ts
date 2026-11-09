import type {
  BenefitReader,
  BenefitQuery,
} from "../../domain/beneficios.contracts.js";
import { BeneficiosPolicy } from "../../domain/beneficios.policy.js";
import { BeneficiosMapper } from "../mapper/beneficios.mapper.js";
import {
  executeBenefitOperation,
  requiredProgram,
  requiredParticipation,
} from "../utils/beneficios-errors.js";

export class ConsultarBeneficiosParticipacaoUseCase {
  constructor(
    private readonly repository: BenefitReader,
    private readonly policy: BeneficiosPolicy,
    private readonly mapper: BeneficiosMapper,
    private readonly clock: () => Date = () => new Date(),
  ) {}
  execute(id: string, participationId: string, query: BenefitQuery = {}) {
    return executeBenefitOperation(async () => {
      const edital = requiredProgram(await this.repository.edital(id));
      const now = this.clock(),
        month = this.policy.month(
          query.mes || this.policy.currentMonth(now),
          now,
        );
      const context = requiredParticipation(
        await this.repository.participation(id, participationId),
      );
      const person = await this.mapper.person(context.pessoa);
      const benefits = await this.repository.benefits(id);
      const deliveries = await this.repository.currentDeliveries(
        id,
        person.id,
        month,
      );
      return {
        mes: month,
        pessoa: person,
        participacao_id: context.participacao.id,
        permitir_encerrados: this.policy.permitirEncerrados,
        impedimento: this.policy.deliveryReason(
          edital,
          context.participacao,
          month,
          now,
        ),
        beneficios: benefits.map((benefit) => ({
          ...benefit,
          retirada:
            deliveries.find((delivery) =>
              delivery.itens.some((item) => item.id === benefit.id),
            ) || null,
        })),
      };
    });
  }
}
