import { PDF_API_URL } from "../../../core/env.js";
import { SequelizeFtBolsistaRepository } from "../../../infra/database/sequelize/repositories/sequelize.ft-bolsista.repository.js";
import RenderEspelhoPontoPdfUseCase from "../../espelho-ponto/application/use-case/render-espelho-ponto-pdf.use-case.js";
import { GerarEspelhoPontoBolsistaUseCase } from "../application/use-case/gerar-espelho-ponto-bolsista.use-case.js";

export const makeGerarEspelhoPontoBolsista = () => new GerarEspelhoPontoBolsistaUseCase(
  new SequelizeFtBolsistaRepository(),
  new RenderEspelhoPontoPdfUseCase(PDF_API_URL),
);
