import { FastifyPluginAsync } from "fastify";
import serviceRouter from "./interface/router/services.router.js";

const ServiceModule: FastifyPluginAsync = async (fastify) => {
  fastify.register(serviceRouter, { prefix: "/service" });
};

export default ServiceModule;
