import { FastifyPluginAsync } from "fastify";
import CarterinhaRouter from "./interface/router/carterinha.router.js";

const CarterinhaModule: FastifyPluginAsync = async (fastify) => {
  fastify.register(CarterinhaRouter, { prefix: "/carterinha" });
};

export default CarterinhaModule;
