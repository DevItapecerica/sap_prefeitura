import { SequelizeSetorRepository } from "../../../infra/database/sequelize/repositories/sequelize.setor.repository.js";
import { GetSetorByIdUseCase } from "../application/use-case/get-setor-by-id.use-case.js";

export const makeGetSetorByIdUseCase = () =>
  new GetSetorByIdUseCase(new SequelizeSetorRepository());
