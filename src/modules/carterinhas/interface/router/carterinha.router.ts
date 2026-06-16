import { FastifyPluginAsync } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import CarterinhaPdfController from "../controller/carterinha-pdf.controller.js";

const CarterinhaRouter: FastifyPluginAsync = async (fastify) => {
  const carterinhaPdfController = new CarterinhaPdfController();

  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);

  fastify.route({
    method: "GET",
    url: "/pdf/:uuid",
    schema: {
      tags: ["Carteirinha"],
      security: [{ JWTToken: [] }],
      params: {
        type: "object",
        required: ["uuid"],
        properties: {
          uuid: { type: "string" },
        },
      },
      response: {
        200: {
          description: "Arquivo PDF da carteirinha",
          content: {
            "application/pdf": {
              schema: {
                type: "string",
                format: "binary",
              },
            },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: carterinhaPdfController.getPdf,
  });
};

export default CarterinhaRouter;
