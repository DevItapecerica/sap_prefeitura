import { PeaadRuleError } from "../../../ft-bolsista/domain/errors/peaad-rule.error.js";

/** The caller obtains the closed month through its transaction-scoped repository. */
export function assertCompetenciasAbertas(closedMonth: string | null) {
  if (closedMonth)
    throw new PeaadRuleError(
      "PAYROLL_MONTH_CLOSED",
      "A folha de " +
        closedMonth +
        " está fechada. Não é possível alterar esta competência.",
    );
}

export function nextCivilDay(date: string) {
  const day = new Date(date + "T12:00:00Z");
  day.setUTCDate(day.getUTCDate() + 1);
  return day.toISOString().slice(0, 10);
}
