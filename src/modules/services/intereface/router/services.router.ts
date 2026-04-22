import Services from "../controller/services.controller.js";
import { FastifyPluginAsync } from "fastify";
import errorResponseSchema from "../../../../core/shared/schema/errorSchema.js";
import AuthMiddleware from "../../../auth/auth.middleware.js";

const serviceRouter: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);

  const serviceProperties = {
    properties: {
      id: { type: "integer", example: 1 },
      name: { type: "string", example: "Serviço 1" },
      description: { type: "string", example: "Descrição do serviço 1" },
      tag: { type: "string", example: "tag1" },
      url: { type: "string", example: "/admin" },
    },
  };

  fastify.route({
    method: "GET",
    url: "/",
    schema: {
      description: "Retorna todos os serviços",
      type: "object",
      tags: ["Services"],
      security: [{ APIKey: [] }],
      response: {
        200: {
          description: "Verificação bem sucedido",
          type: "object",
          properties: {
            services: {
              type: "array",
              example: {
                id: 1,
                name: "Serviço 1",
                description: "Descrição do serviço 1",
                url: "/admin",
              },
            },
            count: { type: "number", example: 1 },
            ok: { type: "boolean", example: true },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: Services.getService,
  });

  fastify.route({
    method: "GET",
    url: "/:id",
    schema: {
      description: "Retorna o serviço pelo ID",
      type: "object",
      tags: ["Services"],
      security: [{ APIKey: [] }],
      response: {
        200: {
          description: "Verificação bem sucedido",
          type: "object",
          ...serviceProperties,
        },

        ...errorResponseSchema,
      },
    },
    handler: Services.getOneService,
  });

  fastify.route({
    method: "POST",
    url: "/",
    schema: {
      description: "Cria um serviço",
      type: "object",
      tags: ["Services"],
      security: [{ APIKey: [] }],
      body: {
        type: "object",
        required: ["service"],
        properties: {
          service: {
            required: ["name", "description", "url"],
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              url: { type: "string" },
            },
          },
        },
      },
      response: {
        201: {
          description: "Post bem sucedido",
          type: "object",
          properties: {
            service: {
              type: "object",
              properties: {
                id: { type: "integer", example: 1 },
                name: { type: "string", example: "Serviço 1" },
                description: {
                  type: "string",
                  example: "Descrição do serviço 1",
                },
                url: { type: "string", example: "/admin" },
              },
            },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: Services.createService,
  });

  fastify.route({
    method: "PUT",
    url: "/:id",
    schema: {
      description: "Atualiza um serviço",
      type: "object",
      tags: ["Services"],
      security: [{ APIKey: [] }],
      body: {
        type: "object",
        required: ["service"],
        properties: {
          service: {
            required: ["name", "description", "url"],
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              url: { type: "string" },
            },
          },
        },
      },
      response: {
        201: {
          description: "Update bem sucedido",
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Serviço atualizado com sucesso",
            },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: Services.updateService,
  });

  fastify.route({
    method: "DELETE",
    url: "/:id",
    schema: {
      description: "Exclude um serviço",
      type: "object",
      tags: ["Services"],
      security: [{ APIKey: [] }],
      response: {
        200: {
          description: "Excluido com sucesso",
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Serviço excluído com sucesso",
            },
          },
        },

        ...errorResponseSchema,
      },
    },
    handler: Services.deleteService,
  });
};

export default serviceRouter;
