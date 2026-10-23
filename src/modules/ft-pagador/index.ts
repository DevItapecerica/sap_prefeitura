import { FastifyPluginAsync } from "fastify";
import { PagadorRouter } from "./pagador.router.js";

const PagadorModule: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return reply.code(410).send({ message: 'Gerencie pagadores dentro do edital', code: 'FT_EDITAL_WORKFLOW_REQUIRED' });
  });
  await fastify.register(PagadorRouter, { prefix: "/frente-de-trabalho/pagador" });
};
export default PagadorModule;
