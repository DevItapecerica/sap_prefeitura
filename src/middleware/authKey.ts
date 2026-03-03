import { FastifyReply, FastifyRequest } from "fastify";
import { API_KEY } from "../core/env.js";

const auth = (request: FastifyRequest, reply: FastifyReply, next: () => void) => {
  const apiKey = request.headers["x-api-key"];

  if (apiKey !== API_KEY) {
    throw {
      code: 401,
      message: "Not authorized",
      ok: false,
      api: "Reservas",
    };
  }

  next();
};

export default auth;
