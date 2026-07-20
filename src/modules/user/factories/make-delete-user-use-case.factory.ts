import { SequelizeUserRepository } from "../../../infra/database/sequelize/repositories/sequelize.user.repository.js";
import { DeleteUserUseCase } from "../application/use-case/delete-user.use-case.js";

export const makeDeleteUserUseCase = () =>
  new DeleteUserUseCase(new SequelizeUserRepository());
