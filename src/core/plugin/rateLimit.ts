import fastifyRateLimit from "@fastify/rate-limit";
import { FastifyPluginAsync, FastifyRequest } from "fastify";

import fp from "fastify-plugin";
import AppError from "../appError.js";

export function rateLimitKey(request: FastifyRequest): string {
  return request.ip;
}

const rateLimit: FastifyPluginAsync = async (fastify) => {
  fastify.register(fastifyRateLimit, {
    global: true,
    max: 100,
    timeWindow: "1 minute",
    addHeaders: {
      "x-ratelimit-limit": true,
      "x-ratelimit-remaining": true,
      "retry-after": true,
    },
    keyGenerator: rateLimitKey,
    errorResponseBuilder: function (request: FastifyRequest, context: { after: string }) {
        const error = new AppError("Too many requests. Try again into " + context.after, 429, "TOO_MANY_REQUESTS");
        throw error;
    },
  });
};

export default fp(rateLimit)
