import { todayInSaoPaulo } from "../../../../core/utils/sao-paulo-date.js";
import { PeaadRuleError } from "../errors/peaad-rule.error.js";

export class EspelhoPontoPeriodoPolicy {
  resolve(
    mes: string,
    referencia: Date,
  ): { inicio: string; fim: string; fimMes: string } {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes || ""))
      throw new PeaadRuleError("REPORT_MONTH_INVALID", "Mes invalido");
    const hoje = todayInSaoPaulo(referencia);
    if (mes > hoje.slice(0, 7))
      throw new PeaadRuleError(
        "REPORT_MONTH_FUTURE",
        "Não é permitido emitir espelho de ponto para mês futuro.",
      );
    const inicio = `${mes}-01`;
    const ultimo = new Date(`${inicio}T12:00:00.000Z`);
    ultimo.setUTCMonth(ultimo.getUTCMonth() + 1);
    ultimo.setUTCDate(0);
    const fim = ultimo.toISOString().slice(0, 10);
    return { inicio, fim: fim < hoje ? fim : hoje, fimMes: fim };
  }
}
