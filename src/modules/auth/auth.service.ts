import AppError from "../../core/appError.js";
import comparePass from "../../core/shared/utils/comparePass.js";
import UserRepository from "../user/domain/repository/user.repository.js";
import { AuthLoginResponse } from "./types.js";

export default class authService {
  constructor(
    private userRepository: UserRepository,
    private logger: any,
  ) {}

  async login(email: string, password: string): Promise<AuthLoginResponse> {
    this.logger.info("Validando login");
    const user = await this.userRepository.getUserByEmail(email);

    if (!user) {
      const error = new AppError(
        "Email ou senha incorretos",
        401,
        "LOGIN_ERROR",
      );
      throw error;
    }

    this.logger.info("Validando senha");
    const validPassword = await comparePass(password, user.password);

    if (!validPassword) {
      const error = new AppError(
        "Email ou senha incorretos",
        401,
        "LOGIN_ERROR",
      );
      throw error;
    }

    this.logger.info("Login realizado com sucesso");

    return {
      user: {
        id: user.id || 0,
        name: user.name,
        role_id: user.role_id,
        setor_id: user.setor_id,
      },
    };
  }
}
