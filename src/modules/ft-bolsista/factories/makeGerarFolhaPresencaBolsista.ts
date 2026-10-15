import { PDF_API_URL } from "../../../core/env.js";
import { SequelizeFtBolsistaRepository } from "../../../infra/database/sequelize/repositories/sequelize.ft-bolsista.repository.js";
import RenderFolhaPresencaPdfUseCase from "../../espelho-ponto/application/use-case/render-folha-presenca-pdf.use-case.js";
import { GerarFolhaPresencaBolsistaUseCase } from "../application/use-case/gerar-folha-presenca-bolsista.use-case.js";

export const makeGerarFolhaPresencaBolsista = () => new GerarFolhaPresencaBolsistaUseCase(
  new SequelizeFtBolsistaRepository(),
  new RenderFolhaPresencaPdfUseCase(PDF_API_URL),
);
