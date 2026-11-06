import { PeaadRuleError } from "../errors/peaad-rule.error.js";
import { todayInSaoPaulo } from "../../../../core/utils/sao-paulo-date.js";
import { getVinculoOperationalEnd } from "../../../ft-edital/domain/services/ft-vinculo-period.service.js";

const getValue = (target: any, key: string) =>
  typeof target?.get === "function" ? target.get(key) : target?.[key];

const toDateOnly = (value: string | Date) => {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const normalized = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== normalized
    ? null
    : normalized;
};

export class FtFaltaPolicyService {
  ensureCanCreateFalta({
    edital,
    vinculo,
    data_falta,
    faltaExistente,
  }: {
    edital: any;
    vinculo: any;
    data_falta: string | Date;
    faltaExistente?: any | null;
  }) {
    if (getValue(edital, "status") !== "ativo") {
      throw new PeaadRuleError("PROGRAM_INACTIVE", "Edital inativo");
    }

    if (!vinculo || getValue(vinculo, "status") !== "ativo") {
      throw new PeaadRuleError(
        "PARTICIPATION_INACTIVE",
        "Bolsista inativo neste edital",
      );
    }

    if (faltaExistente) {
      throw new PeaadRuleError(
        "ABSENCE_ALREADY_RECORDED",
        "Falta ja lancada para esta data",
      );
    }

    const faltaDate = toDateOnly(data_falta);
    const hoje = todayInSaoPaulo();
    const dataVinculo = toDateOnly(getValue(vinculo, "data_vinculo"));
    const operationalEnd = getVinculoOperationalEnd(vinculo) || null;

    if (faltaDate === null) {
      throw new PeaadRuleError(
        "ABSENCE_DATE_INVALID",
        "Data da falta invalida",
      );
    }

    if (faltaDate > hoje) {
      throw new PeaadRuleError(
        "ABSENCE_DATE_FUTURE",
        "Data da falta nao pode ser futura",
      );
    }

    if (dataVinculo !== null && faltaDate < dataVinculo) {
      throw new PeaadRuleError(
        "ABSENCE_OUTSIDE_PARTICIPATION",
        "Data da falta fora do periodo do vinculo",
      );
    }

    if (operationalEnd !== null && faltaDate > operationalEnd) {
      throw new PeaadRuleError(
        "ABSENCE_OUTSIDE_PARTICIPATION",
        "Data da falta fora do periodo do vinculo",
      );
    }
  }
}
