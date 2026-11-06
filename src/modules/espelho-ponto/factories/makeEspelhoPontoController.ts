import { PDF_API_URL } from "../../../core/env.js";
import AxiosEspelhoPontoGateway from "../../../infra/pdf/axios-espelho-ponto.gateway.js";
import RenderEspelhoPontoPdfUseCase from "../application/use-case/render-espelho-ponto-pdf.use-case.js";
import EspelhoPontoController from "../interface/controller/espelho-ponto.controller.js";
export const makeEspelhoPontoController = () =>
  new EspelhoPontoController(
    new RenderEspelhoPontoPdfUseCase(new AxiosEspelhoPontoGateway(PDF_API_URL)),
  );
