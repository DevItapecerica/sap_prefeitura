import { FastifyPluginAsync, FastifyRequest } from "fastify";
import municipeController from "../controller/municipe.controller.js";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { authorizationFactory } from "../../../acess-controll/factory/makeAuthorization.js";

const MunicipeRouter: FastifyPluginAsync = async (fastify) => {
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
    schema: {},
    handler: municipeController.getMunicipe,
  });

    fastify.route({
    method: "GET",
    url: "/:uuid",
    schema: {},
    handler: municipeController.getMunicipeById,
  });

  fastify.route({
    method: "POST",
    url: "/",
    schema: {},
    handler: municipeController.postMunicipe,
  });

    fastify.route({
    method: "PUT",
    url: "/:uuid",
    schema: {},
    handler: municipeController.updateMunicipe,
  });
};

export default MunicipeRouter;
