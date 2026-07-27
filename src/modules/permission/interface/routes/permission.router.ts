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
    {
      schema: listPermissionsSchema,
      config: { audit: { failureAction: "LIST", module: "permission", resourceType: "permission" } },
    },
    PermissionController.getPermissions,
  );
  fastify.get(
    "/:id",
    {
      schema: getPermissionByIdSchema,
      config: { audit: { failureAction: "VIEW", module: "permission", resourceType: "permission", resourceIdParam: "id" } },
    },
    PermissionController.getOnePermission,
  );
  fastify.put(
    "/:id",
    {
      schema: updatePermissionSchema,
      config: { audit: { failureAction: "UPDATE", module: "permission", resourceType: "permission", resourceIdParam: "id" } },
    },
    PermissionController.updatePermission,
  );
};

export default permissionRouter;
