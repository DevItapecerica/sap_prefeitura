import { ftError } from "../../../ft-bolsista/application/utils/ft-error.js";
import {
  CANT_DUPLICATE,
  CANT_REENTER_SAME_MONTH,
} from "../constants/ft-vinculo.constants.js";
import {
  getVinculoOperationalEnd,
  toDateOnly,
} from "./ft-vinculo-period.service.js";

// verifica se possui getter e setter
const getValue = (target: any, key: string) =>
  typeof target?.get === "function" ? target.get(key) : target?.[key];

export const hasBlockingVinculo = (
  vinculos: any[] = [],
  cantDuplicate = CANT_DUPLICATE,
) =>
  vinculos.some(
    (vinculo) => cantDuplicate || getValue(vinculo, "status") === "ativo",
  );

export const hasSameMonthReentry = (
  vinculos: any[] = [],
  dataVinculo?: string | Date,
  cantReenterSameMonth = CANT_REENTER_SAME_MONTH,
) => {
  if (!cantReenterSameMonth || !dataVinculo) return false;
  const referenceMonth = toDateOnly(dataVinculo).slice(0, 7);
  if (!referenceMonth) return false;

  return vinculos.some((source) => {
    const vinculo = source?.toJSON?.() ?? source;
    if (getValue(vinculo, "status") === "ativo") return false;
    const operationalEnd = getVinculoOperationalEnd(vinculo);
    return (
      Boolean(operationalEnd) && referenceMonth <= operationalEnd.slice(0, 7)
    );
  });
};

export class FtVinculoPolicyService {
  constructor(
    private readonly cantDuplicate = CANT_DUPLICATE,
    private readonly cantReenterSameMonth = CANT_REENTER_SAME_MONTH,
  ) {}

  ensureEditalAtivo(edital: any) {
    if (getValue(edital, "status") !== "ativo") {
      throw ftError(400, "Edital inativo");
    }
  }

  ensureCanCreateVinculo(vinculos: any[] = [], dataVinculo?: string | Date) {
    if (hasBlockingVinculo(vinculos, this.cantDuplicate)) {
      throw ftError(409, "Bolsista ja vinculado a este edital");
    }

    if (hasSameMonthReentry(vinculos, dataVinculo, this.cantReenterSameMonth)) {
      throw ftError(
        409,
        "Bolsista so pode retornar a este edital no mes seguinte ao encerramento",
      );
    }
  }

  ensureCanChangeVinculo(edital: any, vinculo: any) {
    this.ensureEditalAtivo(edital);

    if (!vinculo || getValue(vinculo, "status") !== "ativo") {
      throw ftError(400, "Bolsista inativo neste edital");
    }
  }
}
