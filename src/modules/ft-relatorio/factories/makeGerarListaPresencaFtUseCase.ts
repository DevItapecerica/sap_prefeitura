import { SequelizeFtRelatorioRepository } from "../../../infra/database/sequelize/repositories/sequelize.ft-relatorio.repository.js";
import { GerarListaPresencaFtUseCase } from "../application/use-case/gerar-lista-presenca-ft.use-case.js";

export const makeGerarListaPresencaFtUseCase = () => {
  const repository = new SequelizeFtRelatorioRepository();
  return new GerarListaPresencaFtUseCase(repository);
};
