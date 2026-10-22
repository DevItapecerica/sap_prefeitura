import { FastifyPluginAsync, FastifyRequest } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { requirePermission } from "../../../acess-controll/interface/require-permission.js";
import type RolesControllerType from "../controller/roles.controller.js";
import { createRoleSchema } from "../schemas/create-role.schema.js";
import { deleteRoleSchema } from "../schemas/delete-role.schema.js";
import { getRoleByIdSchema } from "../schemas/get-role-by-id.schema.js";
import { listRolesSchema } from "../schemas/list-roles.schema.js";
import { updateRoleSchema } from "../schemas/update-role.schema.js";

const rolesRouter: FastifyPluginAsync<{controller?: typeof RolesControllerType}> = async (fastify, options) => {
  const RolesController = options.controller ?? (await import("../controller/roles.controller.js")).default;
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  const allow = requirePermission("roles");


  fastify.post("/", {
    schema: createRoleSchema,
      preHandler: allow("cadastrar_role"),
    config: { audit: { failureAction: "CREATE", module: "roles", resourceType: "role" } },
  }, RolesController.createRole);
  fastify.get("/", {
    schema: listRolesSchema,
      preHandler: allow("consultar_role"),
    config: { audit: { failureAction: "LIST", module: "roles", resourceType: "role" } },
  }, RolesController.getRoles);
  fastify.get(
    "/:id",
    {
      schema: getRoleByIdSchema,
      preHandler: allow("consultar_role"),
      config: { audit: { failureAction: "VIEW", module: "roles", resourceType: "role", resourceIdParam: "id" } },
    },
    RolesController.getRoleById,
  );
  fastify.put(
    "/:id",
    {
      schema: updateRoleSchema,
      preHandler: allow("editar_role"),
      config: { audit: { failureAction: "UPDATE", module: "roles", resourceType: "role", resourceIdParam: "id" } },
    },
    RolesController.updateRole,
  );
  fastify.delete(
    "/:id",
    {
      schema: deleteRoleSchema,
      preHandler: allow("excluir_role"),
      config: { audit: { failureAction: "DELETE", module: "roles", resourceType: "role", resourceIdParam: "id" } },
    },
    RolesController.deleteRole,
  );
};

export default rolesRouter;
