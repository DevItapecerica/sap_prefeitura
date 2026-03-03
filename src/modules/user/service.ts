import { FastifyReply, FastifyRequest } from "fastify";

export default class UserService {
  static cadastrar = async (request: FastifyRequest, repply: FastifyReply) => {
    const { user } = request.body;
    const hashedPassword = await GenAndSendPass(user.email);
  };
}
