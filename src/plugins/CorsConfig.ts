import Cors from "@fastify/cors";
import { FastifyInstance } from "fastify";
import fp from "fastify-plugin"; // Importe o fastify-plugin

const CorsConfig = (fastify: FastifyInstance, opts: any, done: Function) => {

  fastify.register(Cors, {
    ...opts,
    origin: [
      /^https?:\/\/192\.168\.16\.200(:\d+)?$/,
      /^https?:\/\/189\.20\.192\.252(:\d+)?$/,
      /^https?:\/\/189\.20\.192\.251(:\d+)?$/,
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "x-api-key",
      "x-user-id",
      "x-role-id",
      "x-username",
    ],
    credentials: false,
  });

  done();
};

export default fp(CorsConfig);
