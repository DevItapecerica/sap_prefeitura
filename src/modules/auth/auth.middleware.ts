import { FastifyReply, FastifyRequest } from "fastify";
import AppError from "../../core/appError.js";
import JwtServices from "./utils/jwt.service.js";

export default class AuthMiddleware {
  static verifyJWT = async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new AppError("Token não enviado", 401);
    }

    try {
      const service = new JwtServices(request.log);
      const decoded = service.verify(token);

      request.user = decoded;
    } catch {
      throw new AppError("Token inválido", 401);
    }
  };
}
