import { FastifyPluginAsync } from "fastify";
import { PagadorRouter } from "./pagador.router.js";

const PagadorModule: FastifyPluginAsync = async (fastify) => {
  await fastify.register(PagadorRouter, { prefix: "/frente-de-trabalho/pagador" });
};
export default PagadorModule;
