import { FastifyPluginAsync } from "fastify";
import { frenteDeTrabalhoEditalRouter } from "./interface/router/ft-edital.router.js";

export const frenteDeTrabalhoModule: FastifyPluginAsync = async (fastify) => {
  fastify.register(frenteDeTrabalhoEditalRouter, { prefix: "/frente-de-trabalho/edital" });
};
