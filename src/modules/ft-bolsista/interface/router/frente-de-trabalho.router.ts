import { FastifyPluginAsync } from "fastify";
import { frenteDeTrabalhoEditalRouter } from "./frente-de-trabalho-edital.router.js";
import { frenteDeTrabalhoBolsistaRouter } from "./frente-de-trabalho-bolosista.router.js";

export const frenteDeTrabalhoRouter: FastifyPluginAsync = async (fastify) => {
    fastify.register(frenteDeTrabalhoEditalRouter, { prefix: "/edital" });
    fastify.register(frenteDeTrabalhoBolsistaRouter, { prefix: "/bolsista" });
}; 