import { FastifyPluginAsync, FastifyRequest } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { authorizationFactory } from "../../../acess-controll/factory/makeAuthorization.js";
import RolesController from "../controller/roles.controller.js";
import { createRoleSchema } from "../schemas/create-role.schema.js";
import { deleteRoleSchema } from "../schemas/delete-role.schema.js";
import { getRoleByIdSchema } from "../schemas/get-role-by-id.schema.js";
import { listRolesSchema } from "../schemas/list-roles.schema.js";
import { updateRoleSchema } from "../schemas/update-role.schema.js";

const rolesRouter: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  fastify.addHook("preHandler", async (request: FastifyRequest) => {
    await authorizationFactory(request.log).authorize(
      Number(request.user.id),
      4,
      request.method,
    );
  });

  fastify.post("/", { schema: createRoleSchema }, RolesController.createRole);
  fastify.get("/", { schema: listRolesSchema }, RolesController.getRoles);
  fastify.get(
    "/:id",
    { schema: getRoleByIdSchema },
    RolesController.getRoleById,
  );
  fastify.put(
    "/:id",
    { schema: updateRoleSchema },
    RolesController.updateRole,
  );
  fastify.delete(
    "/:id",
    { schema: deleteRoleSchema },
    RolesController.deleteRole,
  );
};

export default rolesRouter;
