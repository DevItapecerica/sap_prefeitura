import { FastifyPluginAsync } from "fastify";
import { ftEditalRouter } from "./interface/router/ft-edital.router.js";

export const ftEditalModule: FastifyPluginAsync = async (fastify) => {
  fastify.register(ftEditalRouter, { prefix: "/frente-de-trabalho/edital" });
};
