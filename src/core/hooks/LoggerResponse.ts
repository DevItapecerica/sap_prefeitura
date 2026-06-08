import {
  FastifyPluginAsync,
} from "fastify";
import fp from "fastify-plugin"; // Importe o fastify-plugin

const LoggerResponse: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("onResponse", async (request, reply) => {
    request.log.info({
      type: "http_response",
      requestId: request.id,
      method: request.method,
      route: request.routeOptions.url,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime,
      ip: request.ip,
      realIp: request.headers["x-real-ip"] ?? null,
      userId: request.user?.id ?? null,
    });
  });
};

export default fp(LoggerResponse);
