import { FastifyPluginAsync } from "fastify";
import { AuditRoutes } from "./interface/audit.routes.js";
import { startAuditWorker } from "./scheduler/audit.worker.js";
import { makeAuditService } from "./factories/makeAuditService.js";
import { registerUserAuditHandlers } from "./events/on-user-events.js";
import { makeUserEventSubscriber } from "../user/factories/make-user-event-subscriber.factory.js";
import { registerSetorAuditHandlers } from "./events/on-setor-events.js";
import { makeSetorEventSubscriber } from "../setor/factories/make-setor-event-subscriber.factory.js";

const AuditModule: FastifyPluginAsync = async (fastify) => {
  const unregisterUserAuditHandlers = registerUserAuditHandlers(
    makeUserEventSubscriber(),
    makeAuditService(),
    fastify.log,
  );
  const unregisterSetorAuditHandlers = registerSetorAuditHandlers(
    makeSetorEventSubscriber(),
    makeAuditService(),
    fastify.log,
  );
  const worker = startAuditWorker(fastify.log);
  fastify.addHook("onClose", async () => {
    unregisterUserAuditHandlers();
    unregisterSetorAuditHandlers();
    worker.stop();
  });
  await fastify.register(AuditRoutes, { prefix: "/audit" });
};

export default AuditModule;
