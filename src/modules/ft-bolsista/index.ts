import { FastifyPluginAsync } from "fastify";
import { FrenteTrabalhoBolsistaRouter } from "./interface/router/frente-de-trabalho-bolsista.router.js";

const FtBolsistaModule: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return reply.code(410).send({ message: 'Use as operacoes de inscricao e participacao dentro do edital', code: 'FT_EDITAL_WORKFLOW_REQUIRED' });
  });
  fastify.register(FrenteTrabalhoBolsistaRouter, {
    prefix: "/frente-de-trabalho/bolsista",
  });
};

export default FtBolsistaModule;
