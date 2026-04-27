import Services from "../controller/services.controller.js";
import { FastifyPluginAsync, FastifyRequest } from "fastify";
import errorResponseSchema from "../../../../core/shared/schema/errorSchema.js";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { authorizationFactory } from "../../../acess-controll/factory/makeAuthorization.js";

const serviceRouter: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);

  const serviceProperties = {
    type: "object",
    properties: {
      id: { type: "integer", example: 1 },
      name: { type: "string", example: "Serviço 1" },
      description: { type: "string", example: "Descrição do serviço 1" },
      tag: { type: "string", example: "tag1" },
      url: { type: "string", example: "/admin" },
    },
  };

  const visibilityProperties = {
    type: "array",
    items: {
      type: "object",
      properties: {
        id: { type: "integer" },
        setor_id: { type: "integer" },
        service_id: { type: "integer" },
        visibility: { type: "boolean" },
      },
    },
  };

  const permissionsProperties = {
    type: "array",
    items: {
      type: "object",
      properties: {
        id: { type: "integer" },
        service_id: { type: "integer" },
        role_id: { type: "integer" },
        read: { type: "boolean" },
        write: { type: "boolean" },
        edit: { type: "boolean" },
        del: { type: "boolean" },
      },
    },
  };

  const serviceWithPermissionsProperties = {
    ...serviceProperties,
    properties: {
      ...serviceProperties.properties,
      permissions: permissionsProperties,
    },
  };

  fastify.route({
    method: "GET",
    url: "/",
    schema: {
      description: "Retorna todos os serviços",
      type: "object",
      tags: ["Services"],
      security: [{ JWTToken: [] }],
      response: {
        200: {
          description: "Verificação bem sucedido",
          type: "object",
          properties: {
            message: { type: "string", example: "Serviço encontrado" },
            services: {
              type: "array",
              items: serviceProperties,
            },
            count: { type: "number", example: 1 },
            ok: { type: "boolean", example: true },
          },
        },
        ...errorResponseSchema,
      },
    },
    preHandler: async (request: FastifyRequest) => {
      const verifyAuthorization = authorizationFactory(request.log);
      await verifyAuthorization.authorize(
        Number(request.user.id),
        3,
        request.method,
      );
    },
    handler: Services.getService,
  });

  fastify.route({
    method: "GET",
    url: "/user",
    schema: {
      description: "Retorna todos os serviços do usuário com permissões",
      type: "object",
      tags: ["Services"],
      security: [{ JWTToken: [] }],
      response: {
        200: {
          description: "Verificação bem sucedido",
          type: "object",
          properties: {
            message: { type: "string", example: "Serviços encontrado" },
            services: {
              type: "array",
              items: serviceWithPermissionsProperties,
            },
            ok: { type: "boolean", example: true },
          },
        },
        ...errorResponseSchema,
      },
    },
    handler: Services.getVisiblesServices,
  });

  fastify.route({
    method: "GET",
    url: "/:id",
    schema: {
      description: "Retorna o serviço pelo ID",
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "number" },
        },
      },
      type: "object",
      tags: ["Services"],
      security: [{ JWTToken: [] }],
      response: {
        200: {
          description: "Verificação bem sucedido",
          type: "object",
          properties: {
            message: { type: "string", example: "Serviço encontrado" },
            services: serviceProperties,
            visibility: visibilityProperties,
            permissions: permissionsProperties,
            ok: { type: "boolean", example: true },
          },
        },

        ...errorResponseSchema,
      },
    },
    preHandler: async (request: FastifyRequest) => {
      const verifyAuthorization = authorizationFactory(request.log);
      await verifyAuthorization.authorize(
        Number(request.user.id),
        3,
        request.method,
      );
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
      security: [{ JWTToken: [] }],
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
    preHandler: async (request: FastifyRequest) => {
      const verifyAuthorization = authorizationFactory(request.log);
      await verifyAuthorization.authorize(
        Number(request.user.id),
        3,
        request.method,
      );
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
      security: [{ JWTToken: [] }],
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
    preHandler: async (request: FastifyRequest) => {
      const verifyAuthorization = authorizationFactory(request.log);
      await verifyAuthorization.authorize(
        Number(request.user.id),
        3,
        request.method,
      );
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
      security: [{ JWTToken: [] }],
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
    preHandler: async (request: FastifyRequest) => {
      const verifyAuthorization = authorizationFactory(request.log);
      await verifyAuthorization.authorize(
        Number(request.user.id),
        3,
        request.method,
      );
    },
    handler: Services.deleteService,
  });
};

export default serviceRouter;
