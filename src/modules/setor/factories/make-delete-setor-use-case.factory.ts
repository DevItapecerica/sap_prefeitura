import { SequelizeSetorRepository } from "../../../infra/database/sequelize/repositories/sequelize.setor.repository.js";
import { DeleteSetorUseCase } from "../application/use-case/delete-setor.use-case.js";

export const makeDeleteSetorUseCase = () =>
  new DeleteSetorUseCase(new SequelizeSetorRepository());
