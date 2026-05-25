import { FastifyReply, FastifyRequest } from "fastify";
import authService from "./auth.service.js";
import UserRepository from "../user/domain/repository/user.repository.js";
import JwtServices from "./utils/jwt.service.js";
import { SequelizeUserRepository } from "../../infra/database/sequelize/repositories/sequelize.user.repository.js";

export default class authController {
  static async login(
    request: FastifyRequest<{ Body: { email: string; password: string } }>,
    reply: FastifyReply,
  ) {
    const service = new authService(new SequelizeUserRepository(), new JwtServices(request.log), request.log);

    const { email, password } = request.body;
    const response = await service.login(email, password);

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
}
