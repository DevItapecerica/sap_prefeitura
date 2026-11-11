import { BeneficiosController } from "../interface/beneficios.controller.js";
import {
  makeConsultarBeneficiosParticipacao,
  makeEntregarBeneficios,
  makeConsultarHistoricoBeneficios,
  makeEstornarBeneficios,
  makeConsultarRelatorioBeneficios,
  makeExportarRelatorioBeneficios,
} from "./beneficios.factories.js";

export const makeBeneficiosController = () =>
  new BeneficiosController({
    preview: makeConsultarBeneficiosParticipacao(),
    deliver: makeEntregarBeneficios(),
    history: makeConsultarHistoricoBeneficios(),
    reverse: makeEstornarBeneficios(),
    report: makeConsultarRelatorioBeneficios(),
    csv: makeExportarRelatorioBeneficios(),
  });
