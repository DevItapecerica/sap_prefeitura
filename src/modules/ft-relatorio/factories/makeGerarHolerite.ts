import { PDF_API_URL } from "../../../core/env.js";
import { AxiosHoleriteGateway } from "../../../infra/pdf/axios-holerite.gateway.js";
import { GerarHoleriteUseCase } from "../application/use-case/gerar-holerite.use-case.js";
import { makePayrollUnitOfWork } from "./makePayrollUnitOfWork.js";

export const makeGerarHolerite = () =>
  new GerarHoleriteUseCase(
    makePayrollUnitOfWork().read,
    new AxiosHoleriteGateway(PDF_API_URL),
  );
