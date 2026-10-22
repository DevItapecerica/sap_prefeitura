import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { requirePermission } from "../../../acess-controll/interface/require-permission.js";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import type UserControllerType from "../controller/user.controller.js";
import { changeUserPasswordSchema } from "../schemas/change-user-password.schema.js";
import { createUserSchema } from "../schemas/create-user.schema.js";
import { deleteUserSchema } from "../schemas/delete-user.schema.js";
import { getUserByIdSchema } from "../schemas/get-user-by-id.schema.js";
import { listUsersSchema } from "../schemas/list-users.schema.js";
import { updateUserSchema } from "../schemas/update-user.schema.js";

const userRouter: FastifyPluginAsync<{controller?: typeof UserControllerType}> = async (fastify, options) => {
  const UserController = options.controller ?? (await import("../controller/user.controller.js")).default;
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  const allow = requirePermission("usuarios");


  fastify.route({
    method: "GET",
    url: "/",
    config: { audit: { failureAction: "LIST", module: "user", resourceType: "user" } },
    schema: listUsersSchema,
    preHandler: allow("consultar_usuario"),
    handler: UserController.getAllByQuery,
  });

  fastify.route({
    method: "GET",
    url: "/:id",
    config: { audit: { failureAction: "VIEW", module: "user", resourceType: "user", resourceIdParam: "id" } },
    schema: getUserByIdSchema,
    preHandler: allow("consultar_usuario"),
    handler: UserController.getOne,
  });

  fastify.route({
    method: "POST",
    url: "/",
    config: { audit: { failureAction: "CREATE", module: "user", resourceType: "user" } },
    schema: createUserSchema,
    preHandler: allow("cadastrar_usuario"),
    handler: UserController.cadastrar,
  });

  fastify.route({
    method: "DELETE",
    url: "/:id",
    config: { audit: { failureAction: "DELETE", module: "user", resourceType: "user", resourceIdParam: "id" } },
    schema: deleteUserSchema,
    preHandler: allow("excluir_usuario"),
    handler: UserController.delete,
  });

  fastify.route({
    method: "PUT",
    url: "/:id",
    config: { audit: { failureAction: "UPDATE", module: "user", resourceType: "user", resourceIdParam: "id" } },
    schema: updateUserSchema,
    preHandler: allow("editar_usuario"),
    handler: UserController.update,
  });

  fastify.route({
    method: "PUT",
    url: "/alter_password",
    config: { audit: { failureAction: "PASSWORD_CHANGED", module: "user", resourceType: "user" } },
    schema: changeUserPasswordSchema,
    preHandler: allow("alterar_senha_usuario"),
    handler: UserController.alterPassword,
  });
};

export default userRouter;
