import { FastifyPluginAsync } from "fastify";
import { AtletaRouter } from "./interface/router/atleta.router.js";
import { ModalidadeRouter } from "./interface/router/modalidade.router.js";

const EsporteModule: FastifyPluginAsync = async (fastify) => {
  fastify.register(AtletaRouter, { prefix: "/esporte" });
  fastify.register(ModalidadeRouter, { prefix: "/esporte" });
};

export default EsporteModule;
