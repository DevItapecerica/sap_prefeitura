import AppError from "../../../../core/appError.js";
import { User } from "../../domain/entity/User.js";
import UserRepository from "../../domain/repository/user.repository.js";
import { EmailPolicyService } from "../../domain/services/email-policy.service.js";
import { UpdateUserDto } from "../dto/user.dto.js";

export class UpdateUserUseCase {
  constructor(
    private readonly repository: UserRepository,
    private readonly emailPolicy: EmailPolicyService,
  ) {}

  async execute(
    id: number,
    data: UpdateUserDto,
  ): Promise<{ before: User; after: User }> {
    const user = new User(
      data.name,
      data.email,
      data.ramal,
      data.setor_id,
      data.role_id,
    );

    if (await this.repository.getUserByEmail(user.email, id)) {
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

    const before = await this.repository.getUserById(id);
    if (!before) {
      throw new AppError("Usuário nao encontrado", 404, "USER_NOT_FOUND");
    }

    const after = await this.repository.updateUser(id, user);
    return { before, after };
  }
}
