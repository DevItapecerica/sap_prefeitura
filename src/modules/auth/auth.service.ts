import AppError from "../../core/appError.js";
import comparePass from "../../core/shared/utils/comparePass.js";
import UserRepository from "../user/domain/repository/user.repository.js";
import { AuthLoginResponse } from "./types.js";
import JwtServices from "./utils/jwt.service.js";

export default class authService {
  constructor(
    private userRepository: UserRepository,
    private tokenService: JwtServices,
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
    const validPassword = await comparePass(password, user.password || "NoPass");

    if (!validPassword) {
      const error = new AppError(
        "Email ou senha incorretos",
        401,
        "LOGIN_ERROR",
      );
      throw error;
    }

    this.logger.info("Login realizado com sucesso");

    const token_payload = {
      id: user.id || 0,
      name: user.name,
      role_id: user.role_id,
      setor_id: user.setor_id,
    };

    const token = await this.tokenService.sign(token_payload);

    return {
      user: {
        id: user.id || 0,
        name: user.name,
        role_id: user.role_id,
        setor_id: user.setor_id,
      },
      token: token,
    };
  }

  async authUser(token: string) {
    const decript = this.tokenService.verify(token);

    const user = await this.userRepository.getUserById(decript.id);

    if (!user) {
      const error = new AppError("Token inválido", 401, "LOGIN_ERROR");
      throw error;
    }

    return user;
  }
}
