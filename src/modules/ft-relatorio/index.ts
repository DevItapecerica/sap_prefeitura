import { FastifyPluginAsync } from "fastify";
import { FtRelatorioRouter } from "./interface/router/ft-relatorio.router.js";
import { startFtReportWorker } from "./scheduler/ft-relatorio-arquivo.worker.js";

const FtRelatorioModule: FastifyPluginAsync<{ runtimeWorkers?: boolean }> = async (fastify, options) => {
  await fastify.register(FtRelatorioRouter, {
    prefix: "/frente-de-trabalho/relatorio",
  });
  const worker = options.runtimeWorkers === false ? null : startFtReportWorker(fastify.log);
  fastify.addHook("onClose", async () => worker?.stop());
};

export default FtRelatorioModule;
