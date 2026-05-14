import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { FtBolsistaController } from "../controller/frente-de-trabalho-bolosista.controller.js";
// import AuthMiddleware from "../../../auth/auth.middleware.js";
// import { authorizationFactory } from "../../../acess-controll/factory/makeAuthorization.js";

export const ftBolsistaRouter: FastifyPluginAsync = async (fastify) => {
  //     fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  // fastify.addHook("preHandler", async (request: FastifyRequest) => {const verifyAuthorization = authorizationFactory(request.log);
  //   await verifyAuthorization.authorize(Number(request.user.id), 1, request.method);
  //  });

  const responseBolsistaSchema = {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
      cpf: { type: "string", maxLength: 11 },
      local: { type: "string" },
      status: { type: "string", maxLength: 10 },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  };

  fastify.route({
    method: "GET",
    url: "/",
    schema: {
      tags: ["Bolsista"],
      description: "Retorna todos os bolsistas com base na query. Valores aceitos: id -> Para passar o id solicitado, nome, local, cpf \n page -> Para passar o page, limit -> Para passar o limit, order -> Para passar o order",
      summary: "Retorna todos os bolsistas",
      querystring: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          local: { type: "string" },
          cpf: { type: "string", maxLength: 11 },
          page: { type: "number", default: 0 },
          limit: { type: "number", default: 10 },
          order: { type: "string", default: "createdAt:desc" },
        },
      }
    },
    handler: FtBolsistaController.getBolsista,
  });

  // fastify.route({
  //   method: "GET",
  //   url: "/:id",
  //   // schema: BolsistaSchema.getOneBolsistaSchema,
  //   handler: FtBolsistaController.getOneBolsistas,
  // });

  // fastify.route({
  //   method: "POST",
  //   url: "/",
  //   // schema: BolsistaSchema.createBolsistaSchema,
  //   handler: FtBolsistaController.createBolsistas,
  // });

  // fastify.route({
  //   method: "PUT",
  //   url: "/:id",
  //   // schema: BolsistaSchema.updateBolsistaSchema,
  //   handler: FtBolsistaController.updateBolsistas,
  // });

  // fastify.route({
  //   method: "DELETE",
  //   url: "/:id",
  //   // schema: BolsistaSchema.deleteBolsistaSchema,
  //   handler: FtBolsistaController.deleteBolsistas,
  // });

  // // bolsistas expiration
  //   fastify.route({
  //   method: "GET",
  //   url: "/toexpire",
  //   // schema: BolsistaSchema.getBolsistaSchema,
  //   handler: FtBolsistaController.getToExpire,
  // });

  // fastify.route({
  //   method: "PUT",
  //   url: "/prorrogate",
  //   // schema: BolsistaSchema.getBolsistaSchema,
  //   handler: FtBolsistaController.prorrogate,
  // });
};
