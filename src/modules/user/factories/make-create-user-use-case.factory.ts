import { BcryptService } from "../../../core/security/bcrypt/bcrypt.service.js";
import { RandomPasswordGenerator } from "../../../core/security/password/random-password-generator.service.js";
import { SequelizeUserRepository } from "../../../infra/database/sequelize/repositories/sequelize.user.repository.js";
import { NodemailerUserPasswordNotifier } from "../../../infra/mail/nodemailer-user-password-notifier.js";
import { CreateUserUseCase } from "../application/use-case/create-user.use-case.js";
import { EmailPolicyService } from "../domain/services/email-policy.service.js";

export const makeCreateUserUseCase = () =>
  new CreateUserUseCase(
    new SequelizeUserRepository(),
    new EmailPolicyService(),
    new BcryptService(),
    new RandomPasswordGenerator(),
    new NodemailerUserPasswordNotifier(),
  );
