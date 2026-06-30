import { FastifyPluginAsync } from "fastify";
import { FtRelatorioRouter } from "./interface/router/ft-relatorio.router.js";

const FtRelatorioModule: FastifyPluginAsync = async (fastify) => {
  await fastify.register(FtRelatorioRouter, {
    prefix: "/frente-de-trabalho/relatorio",
  });
};

export default FtRelatorioModule;
