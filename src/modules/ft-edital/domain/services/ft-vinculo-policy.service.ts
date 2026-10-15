import { ftError } from "../../../ft-bolsista/application/utils/ft-error.js";
import { CANT_DUPLICATE } from "../constants/ft-vinculo.constants.js";


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

export class FtVinculoPolicyService {
  constructor(private readonly cantDuplicate = CANT_DUPLICATE) {}

  ensureEditalAtivo(edital: any) {
    if (getValue(edital, "status") !== "ativo") {
      throw ftError(400, "Edital inativo");
    }
  }

  ensureCanCreateVinculo(vinculos: any[] = []) {
    if (hasBlockingVinculo(vinculos, this.cantDuplicate)) {
      throw ftError(403, "Bolsista ja vinculado a este edital");
    }
  }

  ensureCanChangeVinculo(edital: any, vinculo: any) {
    this.ensureEditalAtivo(edital);

    if (!vinculo || getValue(vinculo, "status") !== "ativo") {
      throw ftError(400, "Bolsista inativo neste edital");
    }
  }
}
