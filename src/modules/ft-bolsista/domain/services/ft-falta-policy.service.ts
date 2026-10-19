import AppError from "../../../../core/appError.js";
import { todayInSaoPaulo } from "../../../../core/utils/sao-paulo-date.js";
import { getVinculoOperationalEnd } from "../../../ft-edital/domain/services/ft-vinculo-period.service.js";

const ftError = (statusCode: number, message: string) =>
  new AppError(message, statusCode, "FT_MS");

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
      throw ftError(400, "Edital inativo");
    }

    if (!vinculo || getValue(vinculo, "status") !== "ativo") {
      throw ftError(400, "Bolsista inativo neste edital");
    }

    if (faltaExistente) {
      throw ftError(400, "Falta ja lancada para esta data");
    }

    const faltaDate = toDateOnly(data_falta);
    const hoje = todayInSaoPaulo();
    const dataVinculo = toDateOnly(getValue(vinculo, "data_vinculo"));
    const operationalEnd = getVinculoOperationalEnd(vinculo) || null;

    if (faltaDate === null || hoje === null) {
      throw ftError(400, "Data da falta invalida");
    }

    if (faltaDate > hoje) {
      throw ftError(400, "Data da falta nao pode ser futura");
    }

    if (dataVinculo !== null && faltaDate < dataVinculo) {
      throw ftError(400, "Data da falta fora do periodo do vinculo");
    }

    if (operationalEnd !== null && faltaDate > operationalEnd) {
      throw ftError(400, "Data da falta fora do periodo do vinculo");
    }
  }
}
