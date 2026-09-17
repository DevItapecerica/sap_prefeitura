import { FastifyPluginAsync } from "fastify";
import { startFtScheduler } from "./ft-scheduler.js";
import fp from "fastify-plugin";

const schedulerIndex: FastifyPluginAsync = async (fastify) => {
  fastify.log.warn("Registrando FT scheduler.");
  const scheduler = startFtScheduler(fastify.log);

  fastify.addHook("onClose", async () => {
    scheduler.stop();
  });
};

export default fp(schedulerIndex);
