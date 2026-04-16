import { FastifyPluginAsync } from "fastify";
import serviceRouter from "./services.router.js";

const ServiceModule: FastifyPluginAsync = async (fastify) => {
  fastify.register(serviceRouter, { prefix: "/service" });
  fastify.log.info("Service Routes Registrado");
};

export default ServiceModule;
