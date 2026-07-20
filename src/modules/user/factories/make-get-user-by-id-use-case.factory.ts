import { SequelizeUserRepository } from "../../../infra/database/sequelize/repositories/sequelize.user.repository.js";
import { GetUserByIdUseCase } from "../application/use-case/get-user-by-id.use-case.js";

export const makeGetUserByIdUseCase = () =>
  new GetUserByIdUseCase(new SequelizeUserRepository());
