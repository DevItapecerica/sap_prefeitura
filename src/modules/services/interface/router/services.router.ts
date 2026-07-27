import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { authorizationFactory } from "../../../acess-controll/factories/makeAuthorization.js";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import ServicesController from "../controller/services.controller.js";
import { createServiceSchema } from "../schemas/create-service.schema.js";
import { deleteServiceSchema } from "../schemas/delete-service.schema.js";
import { getServiceByIdSchema } from "../schemas/get-service-by-id.schema.js";
import { listServicesSchema } from "../schemas/list-services.schema.js";
import { listVisibleServicesSchema } from "../schemas/list-visible-services.schema.js";
import { updateServiceSchema } from "../schemas/update-service.schema.js";

const authorizeService = async (request: FastifyRequest) => {
  const authorization = authorizationFactory(request.log);
  await authorization.authorize(Number(request.user.id), 3, request.method);
};

const serviceRouter: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);

  fastify.route({
    method: "GET",
    url: "/",
    config: { audit: { failureAction: "LIST", module: "services", resourceType: "service" } },
    schema: listServicesSchema,
    preHandler: authorizeService,
    handler: ServicesController.getService,
  });

  fastify.route({
    method: "GET",
    url: "/user",
    config: { audit: { failureAction: "LIST", module: "services", resourceType: "service" } },
    schema: listVisibleServicesSchema,
    handler: ServicesController.getVisiblesServices,
  });

  fastify.route({
    method: "GET",
    url: "/:id",
    config: { audit: { failureAction: "VIEW", module: "services", resourceType: "service", resourceIdParam: "id" } },
    schema: getServiceByIdSchema,
    preHandler: authorizeService,
    handler: ServicesController.getOneService,
  });

  fastify.route({
    method: "POST",
    url: "/",
    config: { audit: { failureAction: "CREATE", module: "services", resourceType: "service" } },
    schema: createServiceSchema,
    preHandler: authorizeService,
    handler: ServicesController.createService,
  });

  fastify.route({
    method: "PUT",
    url: "/:id",
    config: { audit: { failureAction: "UPDATE", module: "services", resourceType: "service", resourceIdParam: "id" } },
    schema: updateServiceSchema,
    preHandler: authorizeService,
    handler: ServicesController.updateService,
  });

  fastify.route({
    method: "DELETE",
    url: "/:id",
    config: { audit: { failureAction: "DELETE", module: "services", resourceType: "service", resourceIdParam: "id" } },
    schema: deleteServiceSchema,
    preHandler: authorizeService,
    handler: ServicesController.deleteService,
  });
};

export default serviceRouter;
