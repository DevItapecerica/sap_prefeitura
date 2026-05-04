import { FastifyPluginAsync } from "fastify";
import rolesRouter from "./interface/routes/roles.router.js";

const RolesModule: FastifyPluginAsync = async (fastify) => {
  fastify.register(rolesRouter, { prefix: "/roles" });
};

export default RolesModule;
