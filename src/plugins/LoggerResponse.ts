import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin"; // Importe o fastify-plugin

const LoggerResponse = async (fastify: FastifyInstance) => {
  fastify.addHook(
    "onResponse",
    (
      request: FastifyRequest<{
        Headers: { "x-user": string | undefined };
      }>,
      reply: FastifyReply
    ) => {
      const url = request.url;
      const queryData = request.query;
      const remoteAddress = request.ip;
      const user = request.headers["x-user"] || "no User";
      const metodo = request.method;
      const status = reply.statusCode;
      const dataHora = new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date());

      // Acessa o logger e registra as informações
      request.log.info({
        status,
        dataHora,
        metodo,
        url,
        queryData,
        "x-user": user,
        remoteAddress,
        remotePort: request.socket.remotePort,
        message: "incoming request (custom)",
      });

      // logar no db
      // request.log.info({
      //   usuario_uuid: user,
      //   ip_origem: remoteAddress,
      //   response_code: reply.statusCode,
      //   metodo_http: request.method,
      //   data_hora: dataHora,
      //   url_solicitada: request.url,
      // })
    }
  );
};

export default fp(LoggerResponse);
