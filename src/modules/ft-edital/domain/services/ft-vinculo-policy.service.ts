import { ftError } from "../../../ft-bolsista/application/utils/ft-error.js";


// verifica se possui getter e setter
const getValue = (target: any, key: string) =>
  typeof target?.get === "function" ? target.get(key) : target?.[key];

export class FtVinculoPolicyService {
  ensureEditalAtivo(edital: any) {
    if (getValue(edital, "status") !== "ativo") {
      throw ftError(400, "Edital inativo");
    }
  }

  ensureCanCreateVinculo(vinculos: any[] = []) {
    const hasBlockingVinculo = vinculos.some(
      (vinculo) => getValue(vinculo, "status") !== "cancelado",
    );

    if (hasBlockingVinculo) {
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
