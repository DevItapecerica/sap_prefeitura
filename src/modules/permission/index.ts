import { FastifyPluginAsync } from "fastify";
import permissionRouter from "./interface/routes/permission.router.js";

const PermissionModule: FastifyPluginAsync = async (fastify) => {
  fastify.register(permissionRouter, { prefix: "/permissions" });
  fastify.log.info("Permission Routes Registrado");
};

export default PermissionModule;
