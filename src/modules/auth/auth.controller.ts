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
    const service = new authService(new SequelizeUserRepository(), request.log);
    const tokenService = new JwtServices(request.log);
    const { email, password } = request.body;

    const response = await service.login(email, password);

    const token_payload = {
      id: response.user.id,
      name: response.user.name,
      role_id: response.user.role_id,
      setor_id: response.user.setor_id,
    }

    const token = await tokenService.sign(token_payload);

    reply.status(200).send({
      message: "Login bem sucedido",
      token: token,
      user: response.user,
      ok: true,
    });
  }
}
