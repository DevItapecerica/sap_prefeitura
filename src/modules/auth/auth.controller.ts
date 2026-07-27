import { FastifyReply, FastifyRequest } from "fastify";
import authService from "./auth.service.js";
import UserRepository from "../user/domain/repository/user.repository.js";
import JwtServices from "./utils/jwt.service.js";
import { SequelizeUserRepository } from "../../infra/database/sequelize/repositories/sequelize.user.repository.js";
import { NODE_ENV } from "../../core/env.js";
import AppError from "../../core/appError.js";
import { makeAuthEventPublisher } from "./factories/auth-events.factory.js";
import { makeApplicationEventContext } from "../../infra/http/fastify/application-event-context.js";
import { AUTH_EVENTS } from "./application/events/auth.events.js";

const authEvents = makeAuthEventPublisher();

const REFRESH_TOKEN_COOKIE = "refresh_token";
const REFRESH_TOKEN_MAX_AGE_SECONDS = 8 * 60 * 60;
const REFRESH_TOKEN_PATH = "/api";

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: NODE_ENV === "production",
  path: REFRESH_TOKEN_PATH,
  maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
};

export default class authController {
  static async login(
    request: FastifyRequest<{ Body: { email: string; password: string } }>,
    reply: FastifyReply,
  ) {
    const service = new authService(new SequelizeUserRepository(), new JwtServices(request.log), request.log);

    const { email, password } = request.body;
    const response = await service.login(email, password);
    await authEvents.publish(AUTH_EVENTS.loginSucceeded, {
      context: {
        ...makeApplicationEventContext(request),
        actor: {
          id: response.user.id,
          name: response.user.name,
          roleId: response.user.role_id,
          setorId: response.user.setor_id,
        },
      },
    });

    reply.setCookie(
      REFRESH_TOKEN_COOKIE,
      response.refreshToken,
      refreshCookieOptions,
    );

    reply.status(200).send({
      message: "Login bem sucedido",
      token: response.token,
      user: response.user,
      ok: true,
    });
  }

  static async authUser(request: FastifyRequest<{Headers: {authorization: string}}>, reply: FastifyReply) {
    const service = new authService(new SequelizeUserRepository(), new JwtServices(request.log), request.log);
    const token = request.headers.authorization.replace("Bearer ", "");

    const response = await service.authUser(token);

    reply.status(200).send({ message: "Usuário authenticado", user: response, ok: true });

  }

  static async refresh(request: FastifyRequest, reply: FastifyReply) {
    const service = new authService(new SequelizeUserRepository(), new JwtServices(request.log), request.log);
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw new AppError("Sessão não enviada", 401, "SESSION_ERROR");
    }

    const response = await service.refreshSession(refreshToken);

    reply.setCookie(
      REFRESH_TOKEN_COOKIE,
      response.refreshToken,
      refreshCookieOptions,
    );

    reply.status(200).send({
      message: "Sessão renovada",
      token: response.token,
      ok: true,
    });
  }

  static async logout(request: FastifyRequest, reply: FastifyReply) {
    const service = new authService(new SequelizeUserRepository(), new JwtServices(request.log), request.log);
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE];

    const userId = refreshToken ? await service.logout(refreshToken) : null;
    await authEvents.publish(AUTH_EVENTS.logoutSucceeded, {
      context: {
        ...makeApplicationEventContext(request),
        actor: userId === null ? undefined : { id: userId },
      },
      userId,
    });

    reply.clearCookie(REFRESH_TOKEN_COOKIE, {
      path: REFRESH_TOKEN_PATH,
      httpOnly: true,
      sameSite: "lax",
      secure: NODE_ENV === "production",
    });

    reply.status(200).send({ ok: true });
  }
}
