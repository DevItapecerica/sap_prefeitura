import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { BolsistaController } from "../controller/frente-de-trabalho-bolosista.controller.js";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { authorizationFactory } from "../../../acess-controll/factory/makeAuthorization.js";
import { getAuth } from "../controller/frente-de-trabalho-auth.controller.js";

export const frenteDeTrabalhoBolsistaRouter: FastifyPluginAsync = async (fastify) => {
      fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  fastify.addHook("preHandler", async (request: FastifyRequest) => {const verifyAuthorization = authorizationFactory(request.log);
    await verifyAuthorization.authorize(Number(request.user.id), 1, request.method);
   });

    fastify.route({
    method: "GET",
    url: "/",
    // schema: BolsistaSchema.getBolsistaSchema,
    handler: BolsistaController.getBolsistas,
  });

  fastify.route({
    method: "GET",
    url: "/toexpire",
    // schema: BolsistaSchema.getBolsistaSchema,
    handler: BolsistaController.getToExpire,
  });

  fastify.route({
    method: "PUT",
    url: "/prorrogate",
    // schema: BolsistaSchema.getBolsistaSchema,
    handler: BolsistaController.prorrogate,
  });

  fastify.route({
    method: "GET",
    url: "/:id",
    // schema: BolsistaSchema.getOneBolsistaSchema,
    handler: BolsistaController.getOneBolsistas,
  });

  fastify.route({
    method: "POST",
    url: "/",
    // schema: BolsistaSchema.createBolsistaSchema,
    handler: BolsistaController.createBolsistas,
  });

  fastify.route({
    method: "PUT",
    url: "/:id",
    // schema: BolsistaSchema.updateBolsistaSchema,
    handler: BolsistaController.updateBolsistas,
  });

  fastify.route({
    method: "DELETE",
    url: "/:id",
    // schema: BolsistaSchema.deleteBolsistaSchema,
    handler: BolsistaController.deleteBolsistas,
  });

  fastify.route({
    method: "GET",
    url: "/edital/:id",
    // schema: BolsistaSchema.getBolsistaEditalSchema,
    handler: BolsistaController.getBolsistaEdital,
  });

  fastify.route({
    method: "GET",
    url: "/auth",
    // schema: FtAppSchema.getTokenSchema,
    handler: getAuth,
  });

  fastify.route({
    method: "PUT",
    url: "/:bolsista/edital/:edital",
    // schema: BolsistaSchema.toggleBolsistaEditalSchema,
    handler: BolsistaController.toggleBolsistaEdital,
  });
}; 