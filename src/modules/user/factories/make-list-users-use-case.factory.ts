import { SequelizeUserRepository } from "../../../infra/database/sequelize/repositories/sequelize.user.repository.js";
import { ListUsersUseCase } from "../application/use-case/list-users.use-case.js";

export const makeListUsersUseCase = () =>
  new ListUsersUseCase(new SequelizeUserRepository());
