import { SequelizeSetorRepository } from "../../../infra/database/sequelize/repositories/sequelize.setor.repository.js";
import { CreateSetorUseCase } from "../application/use-case/create-setor.use-case.js";

export const makeCreateSetorUseCase = () =>
  new CreateSetorUseCase(new SequelizeSetorRepository());
