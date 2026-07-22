import { FastifyPluginAsync, FastifyRequest } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { authorizationFactory } from "../../../acess-controll/factories/makeAuthorization.js";
import PermissionController from "../controller/permission.controller.js";
import { getPermissionByIdSchema } from "../schemas/get-permission-by-id.schema.js";
import { listPermissionsSchema } from "../schemas/list-permissions.schema.js";
import { updatePermissionSchema } from "../schemas/update-permission.schema.js";

const permissionRouter: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  fastify.addHook("preHandler", async (request: FastifyRequest) => {
    await authorizationFactory(request.log).authorize(
      Number(request.user.id),
      3,
      request.method,
    );
  });

  fastify.get(
    "/",
    { schema: listPermissionsSchema },
    PermissionController.getPermissions,
  );
  fastify.get(
    "/:id",
    { schema: getPermissionByIdSchema },
    PermissionController.getOnePermission,
  );
  fastify.put(
    "/:id",
    { schema: updatePermissionSchema },
    PermissionController.updatePermission,
  );
};

export default permissionRouter;
