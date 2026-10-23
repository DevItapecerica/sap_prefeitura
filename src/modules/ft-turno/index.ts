import { FastifyPluginAsync } from "fastify";
import { TurnoRouter } from "./turno.router.js";

const TurnoModule: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return reply.code(410).send({ message: 'Gerencie turnos dentro do edital', code: 'FT_EDITAL_WORKFLOW_REQUIRED' });
  });
  await fastify.register(TurnoRouter, { prefix: "/frente-de-trabalho/turno" });
};
export default TurnoModule;
