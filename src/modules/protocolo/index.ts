import { FastifyPluginAsync } from "fastify";
import routes from "./interface/protocolo.routes.js";
import { startProtocolNotificationWorker } from "./infra/protocol-notification.worker.js";
const ProtocolModule: FastifyPluginAsync = async (fastify) => { await fastify.register(routes, { prefix: "/protocolo" }); const stop = startProtocolNotificationWorker(fastify.log); fastify.addHook("onClose", async () => stop()); };
export default ProtocolModule;
