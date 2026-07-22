import { FastifyPluginAsync, FastifyRequest } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { authorizationFactory } from "../../../acess-controll/factories/makeAuthorization.js";
import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import { FtRelatorioController } from "../controller/ft-relatorio.controller.js";

const relatorioTags = ["Frente de Trabalho - Relatorio"];
const jwtSecurity = [{ JWTToken: [] }];
const editalIdParamsSchema = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string", format: "uuid" } },
};
const csvResponseSchema = {
  200: {
    type: "string",
    description: "Arquivo CSV",
  },
  ...errorResponseSchema,
};
const periodoQuerySchema = {
  type: "object",
  properties: {
    data_inicio: { type: "string", format: "date" },
    data_fim: { type: "string", format: "date" },
  },
};
const monthQuerySchema = {
  type: "object",
  properties: {
    mes: { type: "string", pattern: "^\\d{4}-(0[1-9]|1[0-2])$" },
  },
};

export const FtRelatorioRouter: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  fastify.addHook("preHandler", async (request: FastifyRequest) => {
    const verifyAuthorization = authorizationFactory(request.log);
    await verifyAuthorization.authorize(
      Number(request.user.id),
      6,
      request.method,
    );
  });

  const registerCsvRoute = ({
    url,
    summary,
    querystring,
    handler,
  }: {
    url: string;
    summary: string;
    querystring: object;
    handler: any;
  }) => {
    fastify.route({
      method: "GET",
      url,
      schema: {
        tags: relatorioTags,
        security: jwtSecurity,
        summary,
        params: editalIdParamsSchema,
        querystring,
        response: csvResponseSchema,
      },
      handler,
    });
  };

  registerCsvRoute({
    url: "/edital/:id",
    summary: "Gerar relatorio CSV do edital",
    querystring: periodoQuerySchema,
    handler: FtRelatorioController.gerarRelatorioEdital,
  });

  registerCsvRoute({
    url: "/edital/:id/faltas",
    summary: "Gerar relatorio mensal de faltas do edital",
    querystring: monthQuerySchema,
    handler: FtRelatorioController.gerarRelatorioFaltasEdital,
  });

  registerCsvRoute({
    url: "/edital/:id/presenca",
    summary: "Gerar lista mensal de presenca do edital",
    querystring: monthQuerySchema,
    handler: FtRelatorioController.gerarListaPresencaEdital,
  });
};
