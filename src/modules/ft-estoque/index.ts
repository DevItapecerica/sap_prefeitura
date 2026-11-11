import type { FastifyPluginAsync } from "fastify";
import { EstoqueRouter } from "./estoque.router.js";
const EstoqueModule: FastifyPluginAsync = async (fastify) => {
  await fastify.register(EstoqueRouter, {
    prefix: "/frente-de-trabalho/estoque",
  });
};
export default EstoqueModule;
