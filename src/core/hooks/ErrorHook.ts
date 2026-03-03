import { FastifyInstance, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin"; // Importe o fastify-plugin
import AppError from "../appError.js";

const ErrorHook: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error, request, reply) => {
    request.log.error({
      err: error,
      route: request.url,
      userId: request.user?.id,
    });

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        message: error.message,
        code: error.code,
        ok: false,
      });
    }

    return reply.status(500).send({
      statusCode: 500,
      message: "Erro interno",
      code: "INTERNAL_ERROR",
      ok: false,
    });
  });
};

export default fp(ErrorHook);
