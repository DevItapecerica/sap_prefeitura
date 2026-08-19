import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { User } from "../../user/domain/entity/User.js";
import AppError from "../../../core/appError.js";

process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??= "mariadb://user:pass@localhost:3306/app_prefeitura_test";
process.env.SECRET_KEY ??= "12345678901234567890123456789012";
process.env.MAIL_ADRESS ??= "test@example.com";
process.env.MAIL_PASSWORD ??= "password";
process.env.MAIL_HOST ??= "localhost";
process.env.CORS_ORIGINS ??= "http://localhost:5173";
process.env.APPLICATION_PORT ??= "3000";

const logger = { info() {} };

class FakeUserRepository {
  users = new Map<number, User>();

  async getUserByEmail(email: string) {
    return [...this.users.values()].find((user) => user.email === email) ?? null;
  }

  async getUserById(id: number) {
    return this.users.get(id) ?? null;
  }
}

class FakeTokenService {
  lastPayload: any;

  async sign(payload: any) {
    this.lastPayload = payload;
    return `token-${payload.id}`;
  }

  verify(token: string) {
    const id = Number(token.replace("token-", ""));
    return { id, name: "User", role_id: 1, setor_id: 1 };
  }
}

class FakeSessionRepository {
  sessions = new Map<string, { userId: number; refreshTokenHash: string; expiresAt: Date; revokedAt: Date | null }>();
  revokedUsers: number[] = [];

  async createSession(userId: number, refreshTokenHash: string, expiresAt: Date) {
    const session = { userId, refreshTokenHash, expiresAt, revokedAt: null };
    this.sessions.set(refreshTokenHash, session);
    return { id: this.sessions.size, ...session };
  }

  async findActiveByTokenHash(refreshTokenHash: string) {
    const session = this.sessions.get(refreshTokenHash);
    if (!session || session.revokedAt || session.expiresAt <= new Date()) return null;
    return { id: 1, ...session };
  }

  async revokeByTokenHash(refreshTokenHash: string) {
    const session = this.sessions.get(refreshTokenHash);
    if (session) session.revokedAt = new Date();
  }

  async revokeAllByUserId(userId: number) {
    this.revokedUsers.push(userId);
    for (const session of this.sessions.values()) {
      if (session.userId === userId) session.revokedAt = new Date();
    }
  }
}

async function makeAuthService() {
  const { default: AuthService } = await import("../auth.service.js");
  const userRepository = new FakeUserRepository();
  const tokenService = new FakeTokenService();
  const sessionRepository = new FakeSessionRepository();
  const service = new AuthService(userRepository as any, tokenService as any, logger, sessionRepository as any);
  return { service, userRepository, tokenService, sessionRepository };
}

function hashRefreshToken(refreshToken: string) {
  return createHash("sha256").update(refreshToken).digest("hex");
}

test("authService rejeita login invalido e realiza login valido", async () => {
  const { service, userRepository, sessionRepository } = await makeAuthService();
  const passwordHash = await bcrypt.hash("SenhaAtual1", 4);
  userRepository.users.set(1, new User("User", "user@itapecerica.sp.gov.br", "1", 1, 1, 1, false, passwordHash));

  await assert.rejects(() => service.login("user@itapecerica.sp.gov.br", "errada"), (error: AppError) => error.code === "LOGIN_ERROR");

  const response = await service.login("user@itapecerica.sp.gov.br", "SenhaAtual1");

  assert.equal(response.token, "token-1");
  assert.equal(response.user.id, 1);
  assert.equal(response.refreshToken.length > 20, true);
  assert.equal(sessionRepository.revokedUsers.includes(1), true);
});

test("authService autentica token e limpa senha do usuario", async () => {
  const { service, userRepository } = await makeAuthService();
  userRepository.users.set(1, new User("User", "user@itapecerica.sp.gov.br", "1", 1, 1, 1, false, "hash"));

  const user = await service.authUser("token-1");

  assert.equal(user.id, 1);
  assert.equal(user.password, undefined);
});

test("authService renova sessao valida e rejeita refresh invalido", async () => {
  const { service, userRepository, sessionRepository } = await makeAuthService();
  userRepository.users.set(1, new User("User", "user@itapecerica.sp.gov.br", "1", 1, 1, 1));
  await sessionRepository.createSession(1, hashRefreshToken("refresh-valido"), new Date(Date.now() + 60_000));

  const response = await service.refreshSession("refresh-valido");

  assert.equal(response.token, "token-1");
  assert.notEqual(response.refreshToken, "refresh-valido");
  await assert.rejects(() => service.refreshSession("refresh-invalido"), (error: AppError) => error.code === "SESSION_ERROR");
});

test("authService revoga sessao no logout", async () => {
  const { service, sessionRepository } = await makeAuthService();
  const tokenHash = hashRefreshToken("refresh-valido");
  await sessionRepository.createSession(1, tokenHash, new Date(Date.now() + 60_000));

  await service.logout("refresh-valido");

  assert.equal((sessionRepository.sessions.get(tokenHash) as any).revokedAt instanceof Date, true);
});
