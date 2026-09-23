import { createHash, timingSafeEqual } from "node:crypto";
import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { getDatabasePoolStats } from "../../infra/database/sequelize/database-pool-stats.js";
import {
  DatabasePoolStatsProvider,
  metricsRegistry,
  recordAuthRequest,
  recordHttpRequest,
  setDatabasePoolStatsProvider,
} from "../observability/metrics.js";

type MetricsOptions = {
  token?: string;
  databasePoolStatsProvider?: DatabasePoolStatsProvider;
};

const digest = (value: string) => createHash("sha256").update(value).digest();
const authorized = (authorization: string | undefined, token: string) => {
  console.log(authorization)
  if (!token || !authorization?.startsWith("Bearer ")) return false;
  return timingSafeEqual(digest(authorization.slice(7)), digest(token));
};

const metricsPlugin: FastifyPluginAsync<MetricsOptions> = async (
  fastify,
  options,
) => {
  setDatabasePoolStatsProvider(
    options.databasePoolStatsProvider ?? getDatabasePoolStats,
  );

  fastify.addHook("onResponse", async (request, reply) => {
    const route = request.routeOptions.url || "unmatched";
    if (route === "/metrics") return;

    const labels = {
      method: request.method,
      route,
      status: String(reply.statusCode),
    };
    recordHttpRequest(labels, reply.elapsedTime / 1_000);

    const authOperation = route.match(/\/(login|refresh|logout|auth)$/)?.[1];
    if (authOperation) {
      recordAuthRequest(
        authOperation,
        reply.statusCode < 400 ? "success" : "error",
      );
    }
  });

  fastify.get(
    "/metrics",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (request, reply) => {
      if (!options.token) {
        return reply
          .status(503)
          .send({ ok: false, code: "METRICS_NOT_CONFIGURED" });
      }
      if (!authorized(request.headers.authorization, options.token)) {
        return reply.status(401).send({ ok: false, code: "UNAUTHORIZED" });
      }
      return reply
        .type(metricsRegistry.contentType)
        .send(await metricsRegistry.metrics());
    },
  );
};

export default fp(metricsPlugin);
