import { FastifyPluginAsync } from "fastify";

const PermissionModule: FastifyPluginAsync = async (fastify) => {
  // fastify.register(serviceRouter, { prefix: "/service" });
  fastify.log.info("Permission Routes Registrado");
};

export default PermissionModule;
