import { FastifyInstance, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin"; // Importe o fastify-plugin
import AppError from "../appError.js";

const ErrorHook: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error, request, reply) => {
    console.log(error)
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

    if (error instanceof Error) {
      const statusCode = "statusCode" in error ? Number(error.statusCode) : 500;
      const isClientError = statusCode >= 400 && statusCode < 500;

      return reply.status(isClientError ? statusCode : 500).send({
        statusCode: isClientError ? statusCode : 500,
        message: isClientError ? error.message : "Erro interno",
        code: isClientError ? "BAD_REQUEST" : "INTERNAL_ERROR",
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
