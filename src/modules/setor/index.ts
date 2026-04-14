import { FastifyPluginAsync } from "fastify";
import setorRouter from "./setor.router.js";

const setorModule: FastifyPluginAsync = async (fastify) => {
  fastify.register(setorRouter, { prefix: "/setor" });
  fastify.log.info("Setor Routes Registrado");
};

export default setorModule;
