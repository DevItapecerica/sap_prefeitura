import { SequelizeSetorRepository } from "../../../infra/database/sequelize/repositories/sequelize.setor.repository.js";
import { UpdateSetorUseCase } from "../application/use-case/update-setor.use-case.js";

export const makeUpdateSetorUseCase = () =>
  new UpdateSetorUseCase(new SequelizeSetorRepository());
