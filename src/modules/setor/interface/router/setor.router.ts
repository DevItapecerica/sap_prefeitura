import { FastifyPluginAsync, FastifyRequest } from "fastify";
import setoresSchema from "../../schema/setoresSchema.js";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import SetorController from "../controller/setor.controller.js";
import { authorizationFactory } from "../../../acess-controll/factory/makeAuthorization.js";

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
    schema: setoresSchema.getSetores,
    handler: SetorController.getSetores,
  });

  fastify.route({
    method: "GET",
    url: "/:id",
    schema: setoresSchema.getOneSetor,
    handler: SetorController.getOneSetor,
  });

  fastify.route({
    method: "POST",
    url: "/",
    schema: setoresSchema.postSetor,
    handler: SetorController.postSetor,
  });

  fastify.route({
    method: "PUT",
    url: "/:id",
    schema: setoresSchema.updateSetor,
    handler: SetorController.updateSetor,
  });

  fastify.route({
    method: "DELETE",
    url: "/:id",
    schema: setoresSchema.deleteSetor,
    handler: SetorController.deleteSetor,
  });
};

export default setorRouter;
