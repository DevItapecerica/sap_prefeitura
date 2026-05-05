import Cors from "@fastify/cors";
import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin"; // Importe o fastify-plugin
import { CORS_ORIGINS } from "../env.js";

const CorsConfig: FastifyPluginAsync = async (fastify, opts)  => {

  fastify.register(Cors, {
    ...opts,
    origin: CORS_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "x-user-id",
      "x-real-ip",
      "Authorization",
    ],
    credentials: false,
  });
};

export default fp(CorsConfig);
