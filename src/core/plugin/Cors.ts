import Cors from "@fastify/cors";
import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin"; // Importe o fastify-plugin
import { CORS_ORIGINS } from "../env.js";

const CorsConfig: FastifyPluginAsync = async (fastify, opts)  => {
  const allowedOrigins = CORS_ORIGINS.split(",").map((origin) => origin.trim());

  fastify.register(Cors, {
    ...opts,
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "x-user-id",
      "x-real-ip",
      "Authorization",
    ],
    credentials: true,
  });
};

export default fp(CorsConfig);
