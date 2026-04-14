import Services from "../controller/serviceController.js";
import ServiceSchema from "../schema/servicesSchema.js";
import auth from "../middleware/authKey.js";

const router = (fastify, options) => {
  fastify.route({
    method: "GET",
    url: "/service",
    schema: ServiceSchema.getServices,
    preHandler: [auth],
    handler: Services.getService,
  });

  fastify.route({
    method: "GET",
    url: "/service/:id",
    schema: ServiceSchema.getOneService,
    preHandler: [auth],
    handler: Services.getOneService,
  });

  fastify.route({
    method: "POST",
    url: "/service",
    schema: ServiceSchema.postServices,
    preHandler: [auth],
    handler: Services.createService,
  });

  fastify.route({
    method: "PUT",
    url: "/service/:id",
    schema: ServiceSchema.updateServices,
    preHandler: [auth],
    handler: Services.updateService,
  });

  fastify.route({
    method: "DELETE",
    url: "/service/:id",
    schema: ServiceSchema.deleteService,
    preHandler: [auth],
    handler: Services.deleteService,
  });
};

export default router;
