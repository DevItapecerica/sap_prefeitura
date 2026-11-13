import { FtFechamentoFolhaService } from "../application/use-case/ft-fechamento-folha.service.js";
import { makePayrollUnitOfWork } from "./makePayrollUnitOfWork.js";

export const makeFtFechamentoFolhaService = () =>
  new FtFechamentoFolhaService(makePayrollUnitOfWork());
