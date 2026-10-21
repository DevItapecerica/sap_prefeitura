import { FastifyPluginAsync, FastifyRequest } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import type SetorControllerType from "../controller/setor.controller.js";
import { requirePermission } from "../../../acess-controll/interface/require-permission.js";
import { createSetorSchema } from "../schemas/create-setor.schema.js";
import { deleteSetorSchema } from "../schemas/delete-setor.schema.js";
import { getSetorByIdSchema } from "../schemas/get-setor-by-id.schema.js";
import { listSetoresSchema } from "../schemas/list-setores.schema.js";
import { updateSetorSchema } from "../schemas/update-setor.schema.js";

const setorRouter: FastifyPluginAsync<{controller?: typeof SetorControllerType}> = async (fastify, options) => {
  const SetorController = options.controller ?? (await import("../controller/setor.controller.js")).default;
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  const allow = requirePermission("setores");


  fastify.route({
    method: "GET",
    url: "/",
    config: { audit: { failureAction: "LIST", module: "setor", resourceType: "setor" } },
    schema: listSetoresSchema,
    preHandler: allow("consultar_setor"),
    handler: SetorController.getSetores,
  });

  fastify.route({
    method: "GET",
    url: "/:id",
    config: { audit: { failureAction: "VIEW", module: "setor", resourceType: "setor", resourceIdParam: "id" } },
    schema: getSetorByIdSchema,
    preHandler: allow("consultar_setor"),
    handler: SetorController.getOneSetor,
  });

  fastify.route({
    method: "POST",
    url: "/",
    config: { audit: { failureAction: "CREATE", module: "setor", resourceType: "setor" } },
    schema: createSetorSchema,
    preHandler: allow("cadastrar_setor"),
    handler: SetorController.postSetor,
  });

  fastify.route({
    method: "PUT",
    url: "/:id",
    config: { audit: { failureAction: "UPDATE", module: "setor", resourceType: "setor", resourceIdParam: "id" } },
    schema: updateSetorSchema,
    preHandler: allow("editar_setor"),
    handler: SetorController.updateSetor,
  });

  fastify.route({
    method: "DELETE",
    url: "/:id",
    config: { audit: { failureAction: "DELETE", module: "setor", resourceType: "setor", resourceIdParam: "id" } },
    schema: deleteSetorSchema,
    preHandler: allow("excluir_setor"),
    handler: SetorController.deleteSetor,
  });
};

export default setorRouter;
