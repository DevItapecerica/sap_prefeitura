import {
  businessDate,
  dateOnly,
} from "../../ft-edital/domain/services/edital-workflow.policy.js";
import type { Program } from "../../ft-edital/domain/repositories/workflow.repository.js";
import { BenefitRuleError } from "./beneficios.contracts.js";
import type {
  Benefit,
  BenefitDelivery,
  BenefitParticipation,
} from "./beneficios.contracts.js";

export const PERMITIR_RETIRADA_BENEFICIOS_APOS_ENCERRAMENTO = false;

export class BeneficiosPolicy {
  constructor(
    readonly permitirEncerrados: boolean = PERMITIR_RETIRADA_BENEFICIOS_APOS_ENCERRAMENTO,
  ) {}
  currentMonth(now: Date): string {
    return businessDate(now).slice(0, 7);
  }
  month(month: string, now: Date): string {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
      throw new BenefitRuleError("INVALID_MONTH", "Competência inválida.");
    if (month > this.currentMonth(now))
      throw new BenefitRuleError(
        "FUTURE_MONTH",
        "Competência futura não permitida.",
      );
    return month;
  }
  workedInMonth(
    p: BenefitParticipation,
    edital: Program,
    month: string,
    now?: Date,
  ): boolean {
    if (!p.ativado_em) return false;
    const start = [dateOnly(p.data_vinculo), dateOnly(edital.vigencia_inicio)]
      .sort((a, b) => a.localeCompare(b))
      .at(-1)!;
    const end = [
      p.expire_at,
      p.concluded_at,
      p.canceled_at,
      p.expired_at,
      edital.data_vencimento,
      ...(now ? [businessDate(now)] : []),
    ]
      .filter((value): value is Date | string => Boolean(value))
      .map(dateOnly)
      .sort((a, b) => a.localeCompare(b))[0];
    return (
      start <= end && start.slice(0, 7) <= month && end.slice(0, 7) >= month
    );
  }
  deliveryReason(
    edital: Program,
    p: BenefitParticipation,
    month: string,
    now: Date,
  ): string | null {
    if (month !== this.currentMonth(now))
      return "A retirada só pode ser registrada no mês atual.";
    if (!this.workedInMonth(p, edital, month, now))
      return "A participação não teve período ativo nesta competência.";
    if (this.permitirEncerrados) return null;
    if (p.status !== "ativo" || p.concluded_at || p.canceled_at || p.expired_at)
      return "Somente participações ativas podem retirar benefícios.";
    const today = businessDate(now);
    if (dateOnly(p.expire_at) < today) return "Participação vencida.";
    if (dateOnly(p.data_vinculo) > today)
      return "A participação ainda não iniciou.";
    if (
      edital.fase !== "aberto" ||
      dateOnly(edital.vigencia_inicio) > today ||
      dateOnly(edital.data_vencimento) < today
    )
      return "O edital precisa estar aberto e vigente.";
    return null;
  }
  selectBenefits(
    benefits: Benefit[],
    ids: string[],
    deliveries: BenefitDelivery[],
  ): Benefit[] {
    if (!ids.length || ids.length !== new Set(ids).size)
      throw new BenefitRuleError(
        "BENEFIT_SELECTION_INVALID",
        "Selecione benefícios sem repetições.",
      );
    const items = ids.map((id) =>
      benefits.find((benefit) => benefit.id === id),
    );
    if (items.some((item) => !item))
      throw new BenefitRuleError(
        "BENEFIT_NOT_FOUND",
        "Benefício não encontrado neste edital.",
      );
    if (
      deliveries.some(
        (delivery) =>
          !delivery.estornado_em &&
          delivery.itens.some((item) => ids.includes(item.id)),
      )
    )
      throw new BenefitRuleError(
        "BENEFIT_ALREADY_DELIVERED",
        "Um dos benefícios já foi retirado nesta competência. Confira novamente.",
      );
    return items
      .filter((item): item is Benefit => Boolean(item))
      .map((item) => ({ ...item }));
  }
  assertEligible(
    edital: Program,
    participant: BenefitParticipation,
    month: string,
    now: Date,
  ): void {
    const reason = this.deliveryReason(edital, participant, month, now);
    if (reason) throw new BenefitRuleError("BENEFIT_INELIGIBLE", reason);
  }
  reversalReason(value: string): string {
    const reason = value.trim();
    if (reason.length < 3 || reason.length > 1000)
      throw new BenefitRuleError(
        "INVALID_REASON",
        "Informe justificativa de 3 a 1000 caracteres.",
      );
    return reason;
  }
  assertReversible(delivery: BenefitDelivery): void {
    if (delivery.estornado_em)
      throw new BenefitRuleError(
        "BENEFIT_ALREADY_REVERSED",
        "Entrega já estornada.",
      );
  }
}
