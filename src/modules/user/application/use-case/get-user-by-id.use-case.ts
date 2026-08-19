import AppError from "../../../../core/appError.js";
import { User } from "../../domain/entity/User.js";
import UserRepository from "../../domain/repository/user.repository.js";

export class GetUserByIdUseCase {
  constructor(private readonly repository: UserRepository) {}

  async execute(id: number): Promise<User> {
    const user = await this.repository.getUserById(id);
    if (!user) {
      throw new AppError("Usuário nao encontrado", 404, "USER_NOT_FOUND");
    }
    return user;
  }
}
