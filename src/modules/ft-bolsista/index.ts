import { FastifyPluginAsync } from "fastify";
import { ftBolsistaRouter } from "./interface/router/frente-de-trabalho-bolosista.router.js";

export const ftBolsistaModule: FastifyPluginAsync = async (fastify) => {
  fastify.register(ftBolsistaRouter, { prefix: "/frente-de-trabalho/bolsista" });
};
