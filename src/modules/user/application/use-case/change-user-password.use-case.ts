import AppError from "../../../../core/appError.js";
import { IBcrypt } from "../../../../core/security/bcrypt/bcrypt.interface.js";
import UserRepository from "../../domain/repository/user.repository.js";
import { PasswordPolicyService } from "../../domain/services/password-policy.service.js";

export class ChangeUserPasswordUseCase {
  constructor(
    private readonly repository: UserRepository,
    private readonly bcrypt: IBcrypt,
    private readonly passwordPolicy: PasswordPolicyService,
  ) {}

  async execute(
    id: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    const user = await this.repository.getUserById(id);
    if (!user) {
      throw new AppError("Usuário nao encontrado", 404, "USER_NOT_FOUND");
    }

    const currentHash = user.password || "NoPass";
    if (!(await this.bcrypt.compare(oldPassword, currentHash))) {
      throw new AppError(
        "Senha antiga incorreta",
        403,
        "USER_PASSWORD_INCORRECT",
      );
    }
    if (!this.passwordPolicy.isValid(newPassword)) {
      throw new AppError(
        "Senha nova nao atende aos criterios minimos",
        400,
        "USER_PASSWORD_WEAK",
      );
    }
    if (await this.bcrypt.compare(newPassword, currentHash)) {
      throw new AppError(
        "Senha nova deve ser diferente da senha atual",
        400,
        "USER_PASSWORD_REUSED",
      );
    }

    const passwordHash = await this.bcrypt.hash(newPassword);
    return this.repository.alterarUserSenha(id, passwordHash);
  }
}
