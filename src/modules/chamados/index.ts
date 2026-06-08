import { FastifyPluginAsync } from "fastify";
import { chamadosRoutes } from "./interface/router/chamado.router.js";


const chamadosModule: FastifyPluginAsync = async (fastify) => {
  fastify.register(chamadosRoutes);
};

export default chamadosModule;
