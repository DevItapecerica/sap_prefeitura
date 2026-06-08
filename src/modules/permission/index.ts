import { FastifyPluginAsync } from "fastify";
import permissionRouter from "./interface/routes/permission.router.js";

const PermissionModule: FastifyPluginAsync = async (fastify) => {
  fastify.register(permissionRouter, { prefix: "/permissions" });
};

export default PermissionModule;
