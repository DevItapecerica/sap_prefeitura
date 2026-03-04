import fp from "fastify-plugin"; // Importe o fastify-plugin
import { FastifyPluginAsync } from "fastify";
import AppError from "../appError.js";

const notFoundHook: FastifyPluginAsync = async (fastify) => {
  await fastify.setNotFoundHandler(
    {
      preHandler: fastify.rateLimit({
        max: 1,
      }),
    },
    function () {
      const error = new AppError("Route not found", 404, "ROUTE_NOT_FOUND");
      throw error;
    },
  );
};

export default fp(notFoundHook);
