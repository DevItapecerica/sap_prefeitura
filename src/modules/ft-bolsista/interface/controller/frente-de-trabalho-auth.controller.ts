import { FastifyReply, FastifyRequest } from "fastify";
import FT_API from "../../api.js";

export const getAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = request.user.id;

  const response = await FT_API.get(`/ft/auth/${user}`);
  const token = response.data.token;

  reply.status(200).send({ token });
};
