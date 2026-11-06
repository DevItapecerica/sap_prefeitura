import type {
  Program,
  Participation,
} from "../repositories/workflow.repository.js";
import { PeaadRuleError } from "../../../ft-bolsista/domain/errors/peaad-rule.error.js";
import { addMonths, businessDate, dateOnly } from "./edital-workflow.policy.js";

export const paymentPatterns: Record<string, RegExp> = {
  bco: /^\d{1,3}$/,
  ag: /^\d{1,4}$/,
  dig_ag: /^[0-9Xx]$/,
  conta: /^\d{1,11}$/,
  dig_conta: /^[0-9Xx]$/,
};
export const paymentIssues = (payment: unknown) =>
  Object.entries(paymentPatterns)
    .filter(
      ([field, pattern]) =>
        !pattern.test(
          String(
            payment && typeof payment === "object"
              ? ((payment as Readonly<Record<string, unknown>>)[field] ?? "")
              : "",
          ),
        ),
    )
    .map(([field]) => ({
      codigo: "PAGAMENTO_" + field.toUpperCase(),
      campo: "payment_info." + field,
      mensagem:
        "Confirme " +
        (
          {
            bco: "o banco",
            ag: "a agência",
            dig_ag: "o dígito da agência",
            conta: "a conta",
            dig_conta: "o dígito da conta",
          } as Record<string, string>
        )[field] +
        ": valor ausente ou inválido.",
    }));
export function extensionEnd(
  e: Partial<Program>,
  row: Partial<Participation>,
  now: Date,
): string {
  if (e.fase !== "aberto" || businessDate(now) > dateOnly(e.data_vencimento))
    throw new PeaadRuleError(
      "PROGRAM_NOT_OPEN",
      "Edital nao esta vigente e aberto",
    );
  const months = Number(e.prorrogacao_meses);
  if (row.status !== "ativo")
    throw new PeaadRuleError(
      "EXTENSION_REQUIRES_ACTIVE",
      "Somente participacao ativa pode ser prorrogada",
    );
  if (row.prorrogated)
    throw new PeaadRuleError(
      "EXTENSION_ALREADY_USED",
      "Prorrogacao ja utilizada",
    );
  if (!Number.isInteger(months) || months < 1)
    throw new PeaadRuleError(
      "EXTENSION_DISABLED",
      "Prorrogacao desabilitada no edital",
    );
  const currentEnd = dateOnly(row.expire_at);
  if (currentEnd < businessDate(now))
    throw new PeaadRuleError("PARTICIPATION_EXPIRED", "Vinculo ja expirou");
  const end = [
    addMonths(currentEnd, months),
    dateOnly(e.data_vencimento),
  ].sort((left, right) => left.localeCompare(right))[0]!;
  if (end <= currentEnd)
    throw new PeaadRuleError(
      "EXTENSION_AT_PROGRAM_LIMIT",
      "Participacao ja alcanca o termino do edital",
    );
  return end;
}
const daysBetween = (a: string, b: string) =>
  Math.round(
    (Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 86400000,
  );
export function participationSignals(
  e: Partial<Program>,
  row: Partial<Participation>,
  now: Date,
) {
  const today = businessDate(now);
  const dias_restantes = row.expire_at
    ? daysBetween(today, dateOnly(row.expire_at))
    : null;
  const dias_reservada =
    row.status === "convocado" && row.createdAt
      ? Math.max(0, daysBetween(businessDate(new Date(row.createdAt)), today))
      : null;
  let prorrogacao_fim: string | null = null,
    prorrogacao_motivo: string | null = null;
  try {
    prorrogacao_fim = extensionEnd(e, row, now);
  } catch (error) {
    prorrogacao_motivo = error instanceof Error ? error.message : String(error);
  }
  return {
    data_referencia: today,
    dias_restantes,
    dias_reservada,
    vencimento_alerta:
      row.status === "ativo" && dias_restantes != null && dias_restantes <= 30
        ? dias_restantes < 0
          ? "vencido"
          : "proximo"
        : null,
    reserva_antiga: dias_reservada != null && dias_reservada >= 7,
    prorrogacao_fim,
    prorrogacao_motivo,
  };
}
