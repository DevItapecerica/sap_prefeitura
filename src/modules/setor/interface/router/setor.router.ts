import { FastifyPluginAsync, FastifyRequest } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import SetorController from "../controller/setor.controller.js";
import { authorizationFactory } from "../../../acess-controll/factories/makeAuthorization.js";
import { createSetorSchema } from "../schemas/create-setor.schema.js";
import { deleteSetorSchema } from "../schemas/delete-setor.schema.js";
import { getSetorByIdSchema } from "../schemas/get-setor-by-id.schema.js";
import { listSetoresSchema } from "../schemas/list-setores.schema.js";
import { updateSetorSchema } from "../schemas/update-setor.schema.js";

const setorRouter: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  fastify.addHook("preHandler", async (request: FastifyRequest) => {
    const verifyAuthorization = authorizationFactory(request.log);
    await verifyAuthorization.authorize(
      Number(request.user.id),
      2,
      request.method,
    );
  });

  fastify.route({
    method: "GET",
    url: "/",
    config: { audit: { failureAction: "LIST", module: "setor", resourceType: "setor" } },
    schema: listSetoresSchema,
    handler: SetorController.getSetores,
  });

  fastify.route({
    method: "GET",
    url: "/:id",
    config: { audit: { failureAction: "VIEW", module: "setor", resourceType: "setor", resourceIdParam: "id" } },
    schema: getSetorByIdSchema,
    handler: SetorController.getOneSetor,
  });

  fastify.route({
    method: "POST",
    url: "/",
    config: { audit: { failureAction: "CREATE", module: "setor", resourceType: "setor" } },
    schema: createSetorSchema,
    handler: SetorController.postSetor,
  });

  fastify.route({
    method: "PUT",
    url: "/:id",
    config: { audit: { failureAction: "UPDATE", module: "setor", resourceType: "setor", resourceIdParam: "id" } },
    schema: updateSetorSchema,
    handler: SetorController.updateSetor,
  });

  fastify.route({
    method: "DELETE",
    url: "/:id",
    config: { audit: { failureAction: "DELETE", module: "setor", resourceType: "setor", resourceIdParam: "id" } },
    schema: deleteSetorSchema,
    handler: SetorController.deleteSetor,
  });
};

export default setorRouter;
