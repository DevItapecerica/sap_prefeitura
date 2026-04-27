import { FastifyPluginAsync } from "fastify";
import { CarterinhasRouter } from "./interface/router/carterinhas.router.js";

const CarterinhasModule: FastifyPluginAsync = async (fastify) => {

    fastify.register(CarterinhasRouter, { prefix: "/carterinhas" });
    fastify.log.info("Carterinhas routes Registrado");
};

export default CarterinhasModule;