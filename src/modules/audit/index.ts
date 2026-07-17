import { FastifyPluginAsync } from "fastify";
import { AuditRoutes } from "./interface/audit.routes.js";
import { startAuditWorker } from "./scheduler/audit.worker.js";

const AuditModule: FastifyPluginAsync = async (fastify) => {
  const worker = startAuditWorker(fastify.log);
  fastify.addHook("onClose", async () => worker.stop());
  await fastify.register(AuditRoutes, { prefix: "/audit" });
};

export default AuditModule;
