import { FastifyPluginAsync } from "fastify";
import { AuditRoutes } from "./interface/audit.routes.js";
import { startAuditWorker } from "./scheduler/audit.worker.js";
import { makeAuditService } from "./factories/makeAuditService.js";
import { registerUserAuditHandlers } from "./events/on-user-events.js";
import { makeUserEventSubscriber } from "../user/factories/user-events.factory.js";

const AuditModule: FastifyPluginAsync = async (fastify) => {
  const unregisterUserAuditHandlers = registerUserAuditHandlers(
    makeUserEventSubscriber(),
    makeAuditService(),
    fastify.log,
  );
  const worker = startAuditWorker(fastify.log);
  fastify.addHook("onClose", async () => {
    unregisterUserAuditHandlers();
    worker.stop();
  });
  await fastify.register(AuditRoutes, { prefix: "/audit" });
};

export default AuditModule;
