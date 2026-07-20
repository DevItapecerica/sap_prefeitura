import AppError from "../../../../core/appError.js";
import { IBcrypt } from "../../../../core/security/bcrypt/bcrypt.interface.js";
import { PasswordGenerator } from "../../../../core/security/password/password-generator.interface.js";
import { User } from "../../domain/entity/User.js";
import UserRepository from "../../domain/repository/user.repository.js";
import { UserPasswordNotifier } from "../../domain/repository/user-password-notifier.repository.js";
import { EmailPolicyService } from "../../domain/services/email-policy.service.js";
import { CreateUserDto } from "../dto/user.dto.js";

export class CreateUserUseCase {
  constructor(
    private readonly repository: UserRepository,
    private readonly emailPolicy: EmailPolicyService,
    private readonly bcrypt: IBcrypt,
    private readonly passwordGenerator: PasswordGenerator,
    private readonly passwordNotifier: UserPasswordNotifier,
  ) {}

  async execute(data: CreateUserDto): Promise<User> {
    const user = new User(
      data.name,
      data.email,
      data.ramal,
      data.setor_id,
      data.role_id,
    );

    if (await this.repository.getUserByEmail(user.email)) {
      throw new AppError(
        "Usuário com email ja cadastrado",
        403,
        "USER_EMAIL_EXISTS",
      );
    }
    if (!user.IsValidEmail()) {
      throw new AppError("Email invalido", 403, "USER_EMAIL_INVALID");
    }
    if (!this.emailPolicy.isInstitutional(user.email)) {
      throw new AppError(
        "Email nao institucional",
        403,
        "USER_EMAIL_INSTITUTIONAL",
      );
    }

    const temporaryPassword = this.passwordGenerator.generate();
    const passwordHash = await this.bcrypt.hash(temporaryPassword);
    await this.passwordNotifier.sendTemporaryPassword(
      user.email,
      temporaryPassword,
    );
    return this.repository.createUser(user, passwordHash);
  }
}
