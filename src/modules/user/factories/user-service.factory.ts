import { SequelizeUserRepository } from "../../../infra/database/sequelize/repositories/sequelize.user.repository.js";
import UserService from "../application/use-case/user.use-case.js";
import { EmailPolicyService } from "../domain/services/email-policy.service.js";

export const UserServiceFactory = (logger: any) => {
  return new UserService(
    new SequelizeUserRepository(),
    new EmailPolicyService(),
    logger,
  );
};
