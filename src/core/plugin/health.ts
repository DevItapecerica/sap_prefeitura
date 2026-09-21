import { FastifyPluginAsync } from "fastify";

export type ReadinessCheck = {
  name: string;
  check: () => Promise<unknown>;
};

const healthRoutes: FastifyPluginAsync<{ checks: ReadinessCheck[] }> = async (
  fastify,
  options,
) => {
  fastify.get("/health", async () => ({ status: "ok" }));

  fastify.get("/ready", async (_request, reply) => {
    const results = await Promise.allSettled(
      options.checks.map((dependency) => dependency.check()),
    );
    const ready = results.every((result) => result.status === "fulfilled");

    return reply.code(ready ? 200 : 503).send({
      status: ready ? "ready" : "not_ready",
    });
  });
};

export default healthRoutes;
