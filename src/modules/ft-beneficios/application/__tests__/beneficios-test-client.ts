import type { IAesCrypt } from "../../../../core/security/aes/AesCrypt.interface.js";
import type { BenefitUnitOfWork } from "../../domain/beneficios.contracts.js";
import { BeneficiosPolicy } from "../../domain/beneficios.policy.js";
import { BeneficiosMapper } from "../mapper/beneficios.mapper.js";
import { ConsultarBeneficiosParticipacaoUseCase } from "../use-case/consultar-beneficios-participacao.use-case.js";
import { EntregarBeneficiosUseCase } from "../use-case/entregar-beneficios.use-case.js";
import { EstornarBeneficiosUseCase } from "../use-case/estornar-beneficios.use-case.js";
import { ConsultarHistoricoBeneficiosUseCase } from "../use-case/consultar-historico-beneficios.use-case.js";
import { ConsultarRelatorioBeneficiosUseCase } from "../use-case/consultar-relatorio-beneficios.use-case.js";
import { ExportarRelatorioBeneficiosUseCase } from "../use-case/exportar-relatorio-beneficios.use-case.js";

/** Test composition uses the same individual use cases with fake ports or real adapters. */
export function beneficiosTestClient(
  unit: BenefitUnitOfWork,
  crypt: IAesCrypt,
  clock: () => Date,
) {
  const policy = new BeneficiosPolicy(),
    mapper = new BeneficiosMapper(crypt);
  const preview = new ConsultarBeneficiosParticipacaoUseCase(
    unit.read,
    policy,
    mapper,
    clock,
  );
  const deliver = new EntregarBeneficiosUseCase(unit, policy, mapper, clock);
  const reverse = new EstornarBeneficiosUseCase(unit, policy, mapper, clock);
  const history = new ConsultarHistoricoBeneficiosUseCase(
    unit.read,
    policy,
    clock,
  );
  const report = new ConsultarRelatorioBeneficiosUseCase(
    unit.read,
    policy,
    mapper,
    clock,
  );
  const csv = new ExportarRelatorioBeneficiosUseCase(report);
  return {
    preview: preview.execute.bind(preview),
    deliver: deliver.execute.bind(deliver),
    reverse: reverse.execute.bind(reverse),
    history: history.execute.bind(history),
    report: report.execute.bind(report),
    csv: csv.execute.bind(csv),
  };
}
