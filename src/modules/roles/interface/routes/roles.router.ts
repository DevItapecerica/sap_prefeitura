import { FastifyPluginAsync } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import RolesController from "../controller/roles.controller.js";

const rolesRouter: FastifyPluginAsync = async (fastify) => {

  fastify.route({
      method: "POST",
      url: "/",
      handler: RolesController.createRole,
    });
  
    fastify.route({
      method: "GET",
      url: "/",
      handler: RolesController.getRoles,
    });
  
    fastify.route({
      method: "GET",
      url: "/:id",
      handler: RolesController.getRoleById,
    });
  
    fastify.route({
      method: "PUT",
      url: "/:id",
      handler: RolesController.updateRole,
    });
  
    fastify.route({
      method: "DELETE",
      url: "/:id",
      handler: RolesController.deleteRole,
    });
};

export default rolesRouter;
