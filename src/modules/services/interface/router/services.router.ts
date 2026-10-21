import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { requirePermission } from "../../../acess-controll/interface/require-permission.js";
import AppError from "../../../../core/appError.js";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import type ServicesControllerType from "../controller/services.controller.js";
import { getServiceByIdSchema } from "../schemas/get-service-by-id.schema.js";
import { listServicesSchema } from "../schemas/list-services.schema.js";
import { listVisibleServicesSchema } from "../schemas/list-visible-services.schema.js";
import { updateServiceSchema } from "../schemas/update-service.schema.js";


const serviceRouter: FastifyPluginAsync<{controller?: typeof ServicesControllerType}> = async (fastify, options) => {
  const ServicesController = options.controller ?? (await import("../controller/services.controller.js")).default;
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  const allow = requirePermission("servicos");

  fastify.route({
    method: "GET",
    url: "/",
    config: { audit: { failureAction: "LIST", module: "services", resourceType: "service" } },
    schema: listServicesSchema,
    preHandler: allow("consultar_servico"),
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
    preHandler: allow("consultar_servico"),
    handler: ServicesController.getOneService,
  });


  fastify.route({
    method: "PUT",
    url: "/:id",
    config: { audit: { failureAction: "UPDATE", module: "services", resourceType: "service", resourceIdParam: "id" } },
    schema: updateServiceSchema,
    preValidation: async request => {
      const body = request.body as any;
      if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some(key => !["service", "visibility"].includes(key)) ||
        (body.service && Object.keys(body.service).some(key => !["name","description","url","tag"].includes(key))))
        throw new AppError("Invalid service metadata request",400,"VALIDATION_ERROR");
    },
    preHandler: allow("editar_servico"),
    handler: ServicesController.updateService,
  });

};

export default serviceRouter;
