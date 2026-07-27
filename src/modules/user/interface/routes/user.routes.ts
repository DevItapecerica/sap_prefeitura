import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { authorizationFactory } from "../../../acess-controll/factories/makeAuthorization.js";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import UserController from "../controller/user.controller.js";
import { changeUserPasswordSchema } from "../schemas/change-user-password.schema.js";
import { createUserSchema } from "../schemas/create-user.schema.js";
import { deleteUserSchema } from "../schemas/delete-user.schema.js";
import { getUserByIdSchema } from "../schemas/get-user-by-id.schema.js";
import { listUsersSchema } from "../schemas/list-users.schema.js";
import { updateUserSchema } from "../schemas/update-user.schema.js";

const userRouter: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  fastify.addHook("preHandler", async (request: FastifyRequest) => {
    const verifyAuthorization = authorizationFactory(request.log);
    await verifyAuthorization.authorize(
      Number(request.user.id),
      1,
      request.method,
    );
  });

  fastify.route({
    method: "GET",
    url: "/",
    config: { audit: { failureAction: "LIST", module: "user", resourceType: "user" } },
    schema: listUsersSchema,
    handler: UserController.getAllByQuery,
  });

  fastify.route({
    method: "GET",
    url: "/:id",
    config: { audit: { failureAction: "VIEW", module: "user", resourceType: "user", resourceIdParam: "id" } },
    schema: getUserByIdSchema,
    handler: UserController.getOne,
  });

  fastify.route({
    method: "POST",
    url: "/",
    config: { audit: { failureAction: "CREATE", module: "user", resourceType: "user" } },
    schema: createUserSchema,
    handler: UserController.cadastrar,
  });

  fastify.route({
    method: "DELETE",
    url: "/:id",
    config: { audit: { failureAction: "DELETE", module: "user", resourceType: "user", resourceIdParam: "id" } },
    schema: deleteUserSchema,
    handler: UserController.delete,
  });

  fastify.route({
    method: "PUT",
    url: "/:id",
    config: { audit: { failureAction: "UPDATE", module: "user", resourceType: "user", resourceIdParam: "id" } },
    schema: updateUserSchema,
    handler: UserController.update,
  });

  fastify.route({
    method: "PUT",
    url: "/alter_password",
    config: { audit: { failureAction: "PASSWORD_CHANGED", module: "user", resourceType: "user" } },
    schema: changeUserPasswordSchema,
    handler: UserController.alterPassword,
  });
};

export default userRouter;
