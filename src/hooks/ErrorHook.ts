import { FastifyInstance } from "fastify";
import fp from "fastify-plugin"; // Importe o fastify-plugin

const ErrorHook = async (fastify: FastifyInstance) => {
  fastify.setErrorHandler((error: any, request, reply) => {
    // Obtém o código de status ou define como 500 por padrão
    var { code = 500, message = "Internal Server Error", ok = false } = error;
    let validation = false;

    // Formata resposta de erro de forma padronizada
    var errorResponse = {};

    // Se for erro de validação, adiciona detalhes
    if (validation) {
      reply.code(400);
      code = 400;
      errorResponse = {
        ok: false,
        validation: validation,
        message: "Confira o corpo da requisição e tente novamente",
      };
    } else {
      if (typeof code === "string") code = 500;

      errorResponse = {
        ok: ok || false,
        validation: false,
        message: message || "Internal Server Error",
      };
    }

    fastify.log.error(errorResponse);

    // Envia resposta com o código de status apropriado
    reply
      .code(code || 500)
      .header("Content-Type", "application/json; charset=utf-8")
      .send(errorResponse);
  });
};

export default fp(ErrorHook);
