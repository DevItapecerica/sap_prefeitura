import { FastifyPluginAsync } from "fastify";
import { EditalWorkflowRouter } from "./interface/router/edital-workflow.router.js";
import schedulerIndex from "./scheduler/schedulerIndex.js";

const FtEditalModule: FastifyPluginAsync<{ runtimeWorkers?: boolean }> = async (
  fastify,
  options,
) => {
  if (options.runtimeWorkers !== false) {
    await fastify.register(schedulerIndex);
    fastify.log.info("Scheduler Registrado");
  }

  await fastify.register(EditalWorkflowRouter, {
    prefix: "/frente-de-trabalho/edital",
  });
};

export default FtEditalModule;
