import type { FastifyBaseLogger } from "fastify";
import AuthService from "../auth.service.js";
import JwtServices from "../utils/jwt.service.js";
import { SequelizeUserRepository } from "../../../infra/database/sequelize/repositories/sequelize.user.repository.js";
import { SequelizeUserSessionRepository } from "../../../infra/database/sequelize/repositories/sequelize.user-session.repository.js";

export const makeAuthService = (logger: FastifyBaseLogger) =>
  new AuthService(
    new SequelizeUserRepository(),
    new JwtServices(logger),
    logger,
    new SequelizeUserSessionRepository(),
  );
