import { FastifyPluginAsync } from "fastify";
import { EspelhoPontoRouter } from "./interface/router/espelho-ponto.router.js";

const EspelhoPontoModule: FastifyPluginAsync = async (fastify) => {
  await fastify.register(EspelhoPontoRouter, { prefix: "/espelhos-ponto" });
};
export default EspelhoPontoModule;
