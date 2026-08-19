import { BcryptService } from "../../../core/security/bcrypt/bcrypt.service.js";
import { RandomPasswordGenerator } from "../../../core/security/password/random-password-generator.service.js";
import { SequelizeUserRepository } from "../../../infra/database/sequelize/repositories/sequelize.user.repository.js";
import { EventBusAdapter } from "../../../infra/event/event-bus.adapter.js";
import { NodemailerUserPasswordNotifier } from "../../../infra/mail/nodemailer-user-password-notifier.js";
import { EventPublisher, EventSubscriber } from "../../../core/event/event-contracts.js";
import { UserEventMap } from "../application/events/user.events.js";
import { ChangeUserPasswordUseCase } from "../application/use-case/change-user-password.use-case.js";
import { CreateUserUseCase } from "../application/use-case/create-user.use-case.js";
import { DeleteUserUseCase } from "../application/use-case/delete-user.use-case.js";
import { GetUserByIdUseCase } from "../application/use-case/get-user-by-id.use-case.js";
import { ListUsersUseCase } from "../application/use-case/list-users.use-case.js";
import { UpdateUserUseCase } from "../application/use-case/update-user.use-case.js";
import { EmailPolicyService } from "../domain/services/email-policy.service.js";
import { PasswordPolicyService } from "../domain/services/password-policy.service.js";

export const makeCreateUserUseCase = () =>
  new CreateUserUseCase(
    new SequelizeUserRepository(),
    new EmailPolicyService(),
    new BcryptService(),
    new RandomPasswordGenerator(),
    new NodemailerUserPasswordNotifier(),
  );

export const makeUpdateUserUseCase = () =>
  new UpdateUserUseCase(new SequelizeUserRepository(), new EmailPolicyService());

export const makeGetUserByIdUseCase = () =>
  new GetUserByIdUseCase(new SequelizeUserRepository());

export const makeListUsersUseCase = () =>
  new ListUsersUseCase(new SequelizeUserRepository());

export const makeDeleteUserUseCase = () =>
  new DeleteUserUseCase(new SequelizeUserRepository());

export const makeChangeUserPasswordUseCase = () =>
  new ChangeUserPasswordUseCase(
    new SequelizeUserRepository(),
    new BcryptService(),
    new PasswordPolicyService(),
  );

export const makeUserEventPublisher = (): EventPublisher<UserEventMap> =>
  new EventBusAdapter<UserEventMap>();

export const makeUserEventSubscriber = (): EventSubscriber<UserEventMap> =>
  new EventBusAdapter<UserEventMap>();
