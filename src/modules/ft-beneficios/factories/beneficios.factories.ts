import AesCryptService from "../../../core/security/aes/AesCrypt.service.js";
import { BeneficiosPolicy } from "../domain/beneficios.policy.js";
import { BeneficiosMapper } from "../application/mapper/beneficios.mapper.js";
import { ConsultarBeneficiosParticipacaoUseCase } from "../application/use-case/consultar-beneficios-participacao.use-case.js";
import { EntregarBeneficiosUseCase } from "../application/use-case/entregar-beneficios.use-case.js";
import { EstornarBeneficiosUseCase } from "../application/use-case/estornar-beneficios.use-case.js";
import { ConsultarHistoricoBeneficiosUseCase } from "../application/use-case/consultar-historico-beneficios.use-case.js";
import { ConsultarRelatorioBeneficiosUseCase } from "../application/use-case/consultar-relatorio-beneficios.use-case.js";
import { ExportarRelatorioBeneficiosUseCase } from "../application/use-case/exportar-relatorio-beneficios.use-case.js";
import { makeBeneficiosUnitOfWork } from "./makeBeneficiosUnitOfWork.js";

export const makeBeneficiosMapper = () =>
  new BeneficiosMapper(new AesCryptService());
export const makeConsultarBeneficiosParticipacao = () =>
  new ConsultarBeneficiosParticipacaoUseCase(
    makeBeneficiosUnitOfWork().read,
    new BeneficiosPolicy(),
    makeBeneficiosMapper(),
  );
export const makeEntregarBeneficios = () =>
  new EntregarBeneficiosUseCase(
    makeBeneficiosUnitOfWork(),
    new BeneficiosPolicy(),
    makeBeneficiosMapper(),
  );
export const makeEstornarBeneficios = () =>
  new EstornarBeneficiosUseCase(
    makeBeneficiosUnitOfWork(),
    new BeneficiosPolicy(),
    makeBeneficiosMapper(),
  );
export const makeConsultarHistoricoBeneficios = () =>
  new ConsultarHistoricoBeneficiosUseCase(
    makeBeneficiosUnitOfWork().read,
    new BeneficiosPolicy(),
  );
export const makeConsultarRelatorioBeneficios = () =>
  new ConsultarRelatorioBeneficiosUseCase(
    makeBeneficiosUnitOfWork().read,
    new BeneficiosPolicy(),
    makeBeneficiosMapper(),
  );
export const makeExportarRelatorioBeneficios = () =>
  new ExportarRelatorioBeneficiosUseCase(makeConsultarRelatorioBeneficios());
