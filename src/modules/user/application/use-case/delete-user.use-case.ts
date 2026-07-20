import AppError from "../../../../core/appError.js";
import UserRepository from "../../domain/repository/user.repository.js";
import { DeleteUserResultDto } from "../dto/delete-user-result.dto.js";

export class DeleteUserUseCase {
  constructor(private readonly repository: UserRepository) {}

  async execute(id: number): Promise<DeleteUserResultDto> {
    const before = await this.repository.getUserById(id);
    if (!before) {
      throw new AppError("Usuário nao encontrado", 404, "USER_NOT_FOUND");
    }
    await this.repository.deleteUser(id);
    return { before, after: null };
  }
}
