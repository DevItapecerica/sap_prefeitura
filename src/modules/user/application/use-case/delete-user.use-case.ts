import AppError from "../../../../core/appError.js";
import { User } from "../../domain/entity/User.js";
import UserRepository from "../../domain/repository/user.repository.js";

export class DeleteUserUseCase {
  constructor(private readonly repository: UserRepository) {}

  async execute(id: number): Promise<{ before: User; after: null }> {
    const before = await this.repository.getUserById(id);
    if (!before) {
      throw new AppError("Usuário nao encontrado", 404, "USER_NOT_FOUND");
    }
    await this.repository.deleteUser(id);
    return { before, after: null };
  }
}
