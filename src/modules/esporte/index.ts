import { FastifyPluginAsync } from "fastify";
import { AtletaRouter } from "./interface/router/atleta.router.js";

const EsporteModule: FastifyPluginAsync = async (fastify) => {
  fastify.register(AtletaRouter, { prefix: "/esporte" });
};

export default EsporteModule;
