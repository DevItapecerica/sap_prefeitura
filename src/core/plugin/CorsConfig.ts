import Cors from "@fastify/cors";
import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin"; // Importe o fastify-plugin

const CorsConfig: FastifyPluginAsync = async (fastify, opts)  => {

  fastify.register(Cors, {
    ...opts,
    origin: [
      /^https?:\/\/192\.168\.16\.200(:\d+)?$/,
      /^https?:\/\/189\.20\.192\.251(:\d+)?$/,
    ],
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
