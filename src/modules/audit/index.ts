import { FastifyPluginAsync } from "fastify";
import { AuditRoutes } from "./interface/audit.routes.js";
import { startAuditWorker } from "./scheduler/audit.worker.js";
import { makeAuditService } from "./factories/makeAuditService.js";
import { registerUserAuditHandlers } from "./events/on-user-events.js";
import { makeUserEventSubscriber } from "../user/factories/user.factories.js";
import { registerSetorAuditHandlers } from "./events/on-setor-events.js";
import { makeSetorEventSubscriber } from "../setor/factories/setor.factories.js";
import { registerServiceAuditHandlers } from "./events/on-service-events.js";
import { makeServiceEventSubscriber } from "../services/factories/service.factories.js";

const AuditModule: FastifyPluginAsync = async (fastify) => {
  const auditService = makeAuditService();
  const unregisterUserAuditHandlers = registerUserAuditHandlers(
    makeUserEventSubscriber(),
    auditService,
    fastify.log,
  );
  const unregisterSetorAuditHandlers = registerSetorAuditHandlers(
    makeSetorEventSubscriber(),
    auditService,
    fastify.log,
  );
  const unregisterServiceAuditHandlers = registerServiceAuditHandlers(
    makeServiceEventSubscriber(),
    auditService,
    fastify.log,
  );
  const worker = startAuditWorker(fastify.log);
  fastify.addHook("onClose", async () => {
    unregisterUserAuditHandlers();
    unregisterSetorAuditHandlers();
    unregisterServiceAuditHandlers();
    worker.stop();
  });
  await fastify.register(AuditRoutes, { prefix: "/audit" });
};

export default AuditModule;
