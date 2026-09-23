import { randomUUID } from "node:crypto";
import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const getRequestId = (request: { headers: Record<string, unknown> }) => {
  const candidate = request.headers["x-request-id"];
  return typeof candidate === "string" && UUID_PATTERN.test(candidate)
    ? candidate.toLowerCase()
    : randomUUID();
};

const requestIdHeader: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("onRequest", async (request, reply) => {
    reply.header("X-Request-Id", request.id);
  });
};

export default fp(requestIdHeader);
