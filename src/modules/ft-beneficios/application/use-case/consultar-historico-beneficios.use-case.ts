import type {
  BenefitReader,
  BenefitQuery,
} from "../../domain/beneficios.contracts.js";
import { BeneficiosPolicy } from "../../domain/beneficios.policy.js";
import {
  executeBenefitOperation,
  requiredProgram,
} from "../utils/beneficios-errors.js";

export class ConsultarHistoricoBeneficiosUseCase {
  constructor(
    private readonly repository: BenefitReader,
    private readonly policy: BeneficiosPolicy,
    private readonly clock: () => Date = () => new Date(),
  ) {}
  execute(id: string, query: BenefitQuery = {}) {
    return executeBenefitOperation(async () => {
      requiredProgram(await this.repository.edital(id));
      const mes = query.mes
        ? this.policy.month(query.mes, this.clock())
        : undefined;
      return this.repository.history(id, { ...query, mes });
    });
  }
}
