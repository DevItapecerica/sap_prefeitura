import AppError from "../../core/appError.js";
import comparePass from "../../core/utils/comparePass.js";
import UserRepository from "../user/domain/repository/user.repository.js";
import { createHash, randomBytes } from "crypto";
import { SequelizeUserSessionRepository } from "../../infra/database/sequelize/repositories/sequelize.user-session.repository.js";
import { AuthLoginResponse, JwtUserPayload, RefreshSessionResponse } from "./types.js";
import JwtServices from "./utils/jwt.service.js";

const REFRESH_TOKEN_BYTES = 48;
const REFRESH_TOKEN_TTL_MS = 30 * 60 * 1000;

export default class authService {
  constructor(
    private userRepository: UserRepository,
    private tokenService: JwtServices,
    private logger: any,
    private sessionRepository = new SequelizeUserSessionRepository(),
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

    const token_payload: JwtUserPayload = {
      id: user.id || 0,
      name: user.name,
      role_id: user.role_id,
      setor_id: user.setor_id,
    };

    const token = await this.tokenService.sign(token_payload);
    const refreshToken = this.generateRefreshToken();

    await this.sessionRepository.revokeAllByUserId(token_payload.id);
    await this.sessionRepository.createSession(
      token_payload.id,
      this.hashRefreshToken(refreshToken),
      this.getRefreshExpirationDate(),
    );

    return {
      user: {
        id: user.id || 0,
        name: user.name,
        role_id: user.role_id,
        setor_id: user.setor_id,
      },
      token: token,
      refreshToken,
    };
  }

  async authUser(token: string) {
    const decript = this.tokenService.verify(token);

    const user = await this.userRepository.getUserById(decript.id);

    if (!user) {
      const error = new AppError("Token inválido", 401, "LOGIN_ERROR");
      throw error;
    }

    user.password = undefined;
    return user;
  }

  async refreshSession(refreshToken: string): Promise<RefreshSessionResponse> {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const session = await this.sessionRepository.findActiveByTokenHash(tokenHash);

    if (!session) {
      throw new AppError("Sessão expirada ou inválida", 401, "SESSION_ERROR");
    }

    const user = await this.userRepository.getUserById(session.userId);

    if (!user) {
      await this.sessionRepository.revokeByTokenHash(tokenHash);
      throw new AppError("Usuário da sessão não encontrado", 401, "SESSION_ERROR");
    }

    const payload: JwtUserPayload = {
      id: user.id || 0,
      name: user.name,
      role_id: user.role_id,
      setor_id: user.setor_id,
    };

    const newRefreshToken = this.generateRefreshToken();

    await this.sessionRepository.revokeAllByUserId(payload.id);
    await this.sessionRepository.createSession(
      payload.id,
      this.hashRefreshToken(newRefreshToken),
      this.getRefreshExpirationDate(),
    );

    return {
      token: await this.tokenService.sign(payload),
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string): Promise<number | null> {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const session = await this.sessionRepository.findActiveByTokenHash(tokenHash);
    await this.sessionRepository.revokeByTokenHash(tokenHash);
    return session?.userId ?? null;
  }

  private generateRefreshToken(): string {
    return randomBytes(REFRESH_TOKEN_BYTES).toString("base64url");
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash("sha256").update(refreshToken).digest("hex");
  }

  private getRefreshExpirationDate(): Date {
    return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  }
}
