import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { authorizationFactory } from "../../../acess-controll/factory/makeAuthorization.js";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import EditalController from "../controller/frente-de-trabalho-edital.controller.js";
import FtEditalController from "../controller/ft-edital.controller.js";

export const ftEditalRouter: FastifyPluginAsync = async (
  fastify,
) => {
  // fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  // fastify.addHook("preHandler", async (request: FastifyRequest) => {
  //   const verifyAuthorization = authorizationFactory(request.log);
  //   await verifyAuthorization.authorize(
  //     Number(request.user.id),
  //     6,
  //     request.method,
  //   );
  // });

  fastify.route({
    method: "GET",
    url: "/",
    // schema: Schema.getEditalSchema,
    handler: FtEditalController.getEdital,
  });

  fastify.route({
    method: "GET",
    url: "/:id",
    // schema: Schema.getEditalById,
    handler: EditalController.getEditalById,
  });

  fastify.route({
    method: "POST",
    url: "/",
    // schema: Schema.createEdital,
    handler: EditalController.postEdital,
  });

  fastify.route({
    method: "PUT",
    url: "/:id",
    // schema: Schema.updateEdital,
    handler: EditalController.updateEdital,
  });

  fastify.route({
    method: "DELETE",
    url: "/:id",
    // schema: Schema.deleteEdital,
    handler: EditalController.deleteEdital,
  });

  // add bolsista
  fastify.route({
    method: "POST",
    url: "/vincularbolsista/:id",
    // schema: Schema.vincularBolsista,
    handler: EditalController.vincularBolsista,
  });

  // edital with bolsista
  fastify.route({
    method: "GET",
    url: "/:id/bolsista",
    handler: EditalController.getEditalWithBolsista,
  });

  // relatory
    fastify.route({
    method: "GET",
    url: "/:id/relatory",
    handler: EditalController.getEditalWithBolsista,
  });  
};
