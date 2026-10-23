import { ftError } from '../../../ft-bolsista/application/utils/ft-error.js';
import { validateHistory } from './edital-workflow.policy.js';
import { toDateOnly } from './ft-vinculo-period.service.js';
const getValue = (target: any, key: string) => typeof target?.get === 'function' ? target.get(key) : target?.[key];

export class FtVinculoPolicyService {
  ensureEditalAtivo(edital: any) {
    if (getValue(edital, "status") !== "ativo") {
      throw ftError(400, "Edital inativo");
    }
  }

  ensureCanCreateVinculo(vinculos: any[], dataVinculo: string | Date | undefined, edital: any) {
    const config = edital?.toJSON?.() ?? edital;
    return validateHistory(config, vinculos.map(v => v.toJSON?.() ?? v), toDateOnly(dataVinculo));
  }

  ensureCanChangeVinculo(edital: any, vinculo: any) {
    this.ensureEditalAtivo(edital);

    if (!vinculo || getValue(vinculo, "status") !== "ativo") {
      throw ftError(400, "Bolsista inativo neste edital");
    }
  }
}
