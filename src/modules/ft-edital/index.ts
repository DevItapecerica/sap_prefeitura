import { FastifyPluginAsync } from "fastify";
import { FtEditalRouter } from "./interface/router/ft-edital.router.js";
import schedulerIndex from "./scheduler/schedulerIndex.js";

const FtEditalModule: FastifyPluginAsync<{ runtimeWorkers?: boolean }> = async (
  fastify,
  options,
) => {
  if (options.runtimeWorkers !== false) {
    await fastify.register(schedulerIndex);
    fastify.log.info("Scheduler Registrado");
  }

  await fastify.register(FtEditalRouter, {
    prefix: "/frente-de-trabalho/edital",
  });
};

export default FtEditalModule;
