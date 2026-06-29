import { SequelizeFtRelatorioRepository } from "../../../infra/database/sequelize/repositories/sequelize.ft-relatorio.repository.js";
import { GerarRelatorioFaltasFtUseCase } from "../application/use-case/gerar-relatorio-faltas-ft.use-case.js";

export const makeGerarRelatorioFaltasFtUseCase = () => {
  const repository = new SequelizeFtRelatorioRepository();
  return new GerarRelatorioFaltasFtUseCase(repository);
};
