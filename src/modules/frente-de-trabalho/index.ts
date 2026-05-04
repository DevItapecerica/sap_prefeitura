import { FastifyPluginAsync } from "fastify";
import { frenteDeTrabalhoRouter } from "./interface/router/frente-de-trabalho.router.js";

export const frenteDeTrabalhoModule: FastifyPluginAsync = async (fastify) => {
  fastify.register(frenteDeTrabalhoRouter, { prefix: "/frente-de-trabalho" });
};
