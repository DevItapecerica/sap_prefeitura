import { FastifyReply, FastifyRequest } from "fastify";
import AppError from "../../core/appError.js";
import JwtServices from "./utils/jwt.service.js";

export default class AuthMiddleware {
  static verifyJWT = async (request: FastifyRequest, reply: FastifyReply) => {
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new AppError("Token não enviado", 401);
    }

    const bearerToken = /^Bearer ([^\s]+)$/.exec(authorization);

    if (!bearerToken) {
      throw new AppError("Token inválido", 401);
    }

    try {
      const service = new JwtServices(request.log);
      const decoded = service.verify(bearerToken[1]);

      request.user = decoded;
    } catch {
      throw new AppError("Token inválido", 401);
    }
  };
}
