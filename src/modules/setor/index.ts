import { FastifyPluginAsync } from "fastify";
import setorRouter from "./interface/router/setor.router.js";

const setorModule: FastifyPluginAsync = async (fastify) => {
  fastify.register(setorRouter, { prefix: "/setores" });
};

export default setorModule;
