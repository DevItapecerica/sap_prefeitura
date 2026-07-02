import { SequelizeFtRelatorioRepository } from "../../../infra/database/sequelize/repositories/sequelize.ft-relatorio.repository.js";
import { GerarRelatorioFtUseCase } from "../application/use-case/gerar-relatorio-ft.use-case.js";

export const makeGerarRelatorioFtUseCase = () => {
  const repository = new SequelizeFtRelatorioRepository();
  return new GerarRelatorioFtUseCase(repository);
};
