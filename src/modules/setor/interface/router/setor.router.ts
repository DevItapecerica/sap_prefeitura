import { FastifyPluginAsync, FastifyRequest } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import SetorController from "../controller/setor.controller.js";
import { authorizationFactory } from "../../../acess-controll/factory/makeAuthorization.js";
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
    schema: listSetoresSchema,
    handler: SetorController.getSetores,
  });

  fastify.route({
    method: "GET",
    url: "/:id",
    schema: getSetorByIdSchema,
    handler: SetorController.getOneSetor,
  });

  fastify.route({
    method: "POST",
    url: "/",
    schema: createSetorSchema,
    handler: SetorController.postSetor,
  });

  fastify.route({
    method: "PUT",
    url: "/:id",
    schema: updateSetorSchema,
    handler: SetorController.updateSetor,
  });

  fastify.route({
    method: "DELETE",
    url: "/:id",
    schema: deleteSetorSchema,
    handler: SetorController.deleteSetor,
  });
};

export default setorRouter;
