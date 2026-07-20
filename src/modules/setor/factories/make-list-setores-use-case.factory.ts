import { SequelizeSetorRepository } from "../../../infra/database/sequelize/repositories/sequelize.setor.repository.js";
import { ListSetoresUseCase } from "../application/use-case/list-setores.use-case.js";

export const makeListSetoresUseCase = () =>
  new ListSetoresUseCase(new SequelizeSetorRepository());
