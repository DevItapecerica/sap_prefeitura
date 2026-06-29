import AppError from "../../../../core/appError.js";

const ftError = (statusCode: number, message: string) =>
  new AppError(message, statusCode, "FT_MS");

const getValue = (target: any, key: string) =>
  typeof target?.get === "function" ? target.get(key) : target?.[key];

const toDateOnly = (value: string | Date) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
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
    const hoje = toDateOnly(new Date());
    const dataVinculo = toDateOnly(getValue(vinculo, "data_vinculo"));
    const expireAtValue = getValue(vinculo, "expire_at");
    const expireAt = expireAtValue ? toDateOnly(expireAtValue) : null;

    if (faltaDate === null || hoje === null) {
      throw ftError(400, "Data da falta invalida");
    }

    if (faltaDate > hoje) {
      throw ftError(400, "Data da falta nao pode ser futura");
    }

    if (dataVinculo !== null && faltaDate < dataVinculo) {
      throw ftError(400, "Data da falta fora do periodo do vinculo");
    }

    if (expireAt !== null && faltaDate > expireAt) {
      throw ftError(400, "Data da falta fora do periodo do vinculo");
    }
  }
}
