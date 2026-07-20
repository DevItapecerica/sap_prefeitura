import { BcryptService } from "../../../core/security/bcrypt/bcrypt.service.js";
import { SequelizeUserRepository } from "../../../infra/database/sequelize/repositories/sequelize.user.repository.js";
import { ChangeUserPasswordUseCase } from "../application/use-case/change-user-password.use-case.js";
import { PasswordPolicyService } from "../domain/services/password-policy.service.js";

export const makeChangeUserPasswordUseCase = () =>
  new ChangeUserPasswordUseCase(
    new SequelizeUserRepository(),
    new BcryptService(),
    new PasswordPolicyService(),
  );
