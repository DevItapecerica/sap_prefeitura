import { FastifyPluginAsync } from "fastify";
import { TurnoRouter } from "./turno.router.js";

const TurnoModule: FastifyPluginAsync = async (fastify) => {
  await fastify.register(TurnoRouter, { prefix: "/frente-de-trabalho/turno" });
};
export default TurnoModule;
