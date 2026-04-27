import Cors from "@fastify/cors";
import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin"; // Importe o fastify-plugin

const CorsConfig: FastifyPluginAsync = async (fastify, opts)  => {

  fastify.register(Cors, {
    ...opts,
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "x-user-id",
      "Authorization",
    ],
    credentials: false,
  });
};

export default fp(CorsConfig);
