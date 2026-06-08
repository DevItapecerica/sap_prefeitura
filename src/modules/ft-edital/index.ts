import { FastifyPluginAsync } from "fastify";
import { FtEditalRouter } from "./interface/router/ft-edital.router.js";

const FtEditalModule: FastifyPluginAsync = async (fastify) => {
  fastify.register(FtEditalRouter, {
    prefix: "/frente-de-trabalho/edital",
  });
};

export default FtEditalModule;
