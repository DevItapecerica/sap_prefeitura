import { FastifyPluginAsync } from "fastify";
import { FrenteTrabalhoBolsistaRouter } from "./interface/router/frente-de-trabalho-bolsista.router.js";

const FtBolsistaModule: FastifyPluginAsync = async (fastify) => {
  fastify.register(FrenteTrabalhoBolsistaRouter, {
    prefix: "/frente-de-trabalho/bolsista",
  });
};

export default FtBolsistaModule;
