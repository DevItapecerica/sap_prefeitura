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
import { registerRoleAuditHandlers } from "./events/on-role-events.js";
import { makeRoleEventSubscriber } from "../roles/factories/role.factories.js";
import { registerPermissionAuditHandlers } from "./events/on-permission-events.js";
import { makePermissionEventSubscriber } from "../permission/factories/permission.factories.js";
import { makeResourceReadEventSubscriber } from "../../factories/resource-read-events.factory.js";
import { registerResourceReadAuditHandlers } from "./events/on-resource-read-events.js";
import { makeHttpRequestFailedEventSubscriber } from "../../factories/http-request-failed-events.factory.js";
import { registerHttpRequestFailedAuditHandler } from "./events/on-http-request-failed.js";
import { makeAuthEventSubscriber } from "../auth/factories/auth-events.factory.js";
import { registerAuthAuditHandlers } from "./events/on-auth-events.js";
import { makeMunicipeEventSubscriber } from "../municipe/factories/municipe-events.factory.js";
import { registerMunicipeAuditHandlers } from "./events/on-municipe-events.js";
import { makeEsporteEventSubscriber } from "../esporte/factories/esporte-events.factory.js";
import { registerEsporteAuditHandlers } from "./events/on-esporte-events.js";
import { makeFtEditalEventSubscriber } from "../ft-edital/factories/ft-edital-events.factory.js";
import { registerFtEditalAuditHandlers } from "./events/on-ft-edital-events.js";
import { makeFtBolsistaEventSubscriber } from "../ft-bolsista/factories/ft-bolsista-events.factory.js";
import { registerFtBolsistaAuditHandlers } from "./events/on-ft-bolsista-events.js";

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

  const unregisterRoleAuditHandlers = registerRoleAuditHandlers(
    makeRoleEventSubscriber(),
    auditService,
    fastify.log,
  );

  const unregisterPermissionAuditHandlers = registerPermissionAuditHandlers(
    makePermissionEventSubscriber(),
    auditService,
    fastify.log,
  );
  const unregisterResourceReadAuditHandlers =
    registerResourceReadAuditHandlers(
      makeResourceReadEventSubscriber(),
      auditService,
      fastify.log,
    );
  const unregisterHttpRequestFailedAuditHandler =
    registerHttpRequestFailedAuditHandler(
      makeHttpRequestFailedEventSubscriber(),
      auditService,
      fastify.log,
    );
  const unregisterAuthAuditHandlers = registerAuthAuditHandlers(
    makeAuthEventSubscriber(),
    auditService,
    fastify.log,
  );
  const unregisterMunicipeAuditHandlers = registerMunicipeAuditHandlers(
    makeMunicipeEventSubscriber(),
    auditService,
    fastify.log,
  );
  const unregisterEsporteAuditHandlers = registerEsporteAuditHandlers(
    makeEsporteEventSubscriber(),
    auditService,
    fastify.log,
  );
  const unregisterFtEditalAuditHandlers = registerFtEditalAuditHandlers(
    makeFtEditalEventSubscriber(),
    auditService,
    fastify.log,
  );
  const unregisterFtBolsistaAuditHandlers = registerFtBolsistaAuditHandlers(
    makeFtBolsistaEventSubscriber(),
    auditService,
    fastify.log,
  );
  
  const worker = startAuditWorker(fastify.log);
  fastify.addHook("onClose", async () => {
    unregisterUserAuditHandlers();
    unregisterSetorAuditHandlers();
    unregisterServiceAuditHandlers();
    unregisterRoleAuditHandlers();
    unregisterPermissionAuditHandlers();
    unregisterResourceReadAuditHandlers();
    unregisterHttpRequestFailedAuditHandler();
    unregisterAuthAuditHandlers();
    unregisterMunicipeAuditHandlers();
    unregisterEsporteAuditHandlers();
    unregisterFtEditalAuditHandlers();
    unregisterFtBolsistaAuditHandlers();
    worker.stop();
  });
  await fastify.register(AuditRoutes, { prefix: "/audit" });
};

export default AuditModule;
