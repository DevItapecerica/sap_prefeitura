import { SequelizeUserRepository } from "../../../infra/database/sequelize/repositories/sequelize.user.repository.js";
import { UpdateUserUseCase } from "../application/use-case/update-user.use-case.js";
import { EmailPolicyService } from "../domain/services/email-policy.service.js";

export const makeUpdateUserUseCase = () =>
  new UpdateUserUseCase(
    new SequelizeUserRepository(),
    new EmailPolicyService(),
  );
