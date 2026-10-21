import { FastifyPluginAsync, FastifyRequest } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { requirePermission } from "../../../acess-controll/interface/require-permission.js";
import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import type { FtRelatorioController as FtRelatorioControllerType } from "../controller/ft-relatorio.controller.js";

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
const downloadIdParamsSchema = { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } };
const arquivoSchema = {
  type: "object", additionalProperties: true,
  properties: {
    id: { type: "string", format: "uuid" }, nome_arquivo: { type: "string" },
    tipo: { type: "string", enum: ["espelhos_ponto", "folhas_presenca"] },
    status: { type: "string", enum: ["aguardando", "processando", "concluido", "erro", "excluido"] },
    edital_id: { type: "string", format: "uuid" }, mes: { type: "string" }, solicitado_por: { type: "number" },
    tamanho_bytes: { type: ["number", "null"] }, total_bolsistas: { type: "number" }, total_gerados: { type: "number" }, total_falhas: { type: "number" },
    tentativas: { type: "number" }, mensagem_erro: { type: ["string", "null"] }, createdAt: { type: "string" }, updatedAt: { type: "string" },
  },
};

export const FtRelatorioRouter: FastifyPluginAsync<{controller?: typeof FtRelatorioControllerType}> = async (fastify, options) => {
  const FtRelatorioController = options.controller ?? (await import("../controller/ft-relatorio.controller.js")).FtRelatorioController;
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  const allow = requirePermission("ft");


  const registerCsvRoute = ({
    url,
    summary,
    querystring,
    handler,
    action,
  }: {
    url: string;
    summary: string;
    querystring: object;
    handler: any;
    action: string;
  }) => {
    fastify.route({
      method: "GET",
      url,
      config: {
        audit: {
          failureAction: "EXPORT",
          module: "ft-relatorio",
          resourceType: "relatorio",
          resourceIdParam: "id",
        },
      },
      schema: {
        tags: relatorioTags,
        security: jwtSecurity,
        summary,
        params: editalIdParamsSchema,
        querystring,
        response: csvResponseSchema,
      },
      preHandler: allow(action),
      handler,
    });
  };

  registerCsvRoute({
    url: "/edital/:id",
    summary: "Gerar relatorio CSV do edital",
    querystring: periodoQuerySchema,
    action: "gerar_relatorio_edital",
    handler: FtRelatorioController.gerarRelatorioEdital,
  });

  registerCsvRoute({
    url: "/edital/:id/faltas",
    summary: "Gerar relatorio mensal de faltas do edital",
    querystring: monthQuerySchema,
    action: "gerar_relatorio_faltas",
    handler: FtRelatorioController.gerarRelatorioFaltasEdital,
  });

  registerCsvRoute({
    url: "/edital/:id/presenca",
    summary: "Gerar lista mensal de presenca do edital",
    querystring: monthQuerySchema,
    action: "gerar_lista_presenca",
    handler: FtRelatorioController.gerarListaPresencaEdital,
  });

  fastify.route({
    method: "POST", url: "/edital/:id/espelhos-ponto",
    config: { audit: { failureAction: "EXPORT", module: "ft-relatorio", resourceType: "lote_espelho_ponto", resourceIdParam: "id" } },
    schema: { tags: relatorioTags, security: jwtSecurity, summary: "Solicitar espelhos de ponto em lote", params: editalIdParamsSchema,
      body: { type: "object", additionalProperties: false, required: ["mes"], properties: { mes: { type: "string", pattern: "^\\d{4}-(0[1-9]|1[0-2])$" } } },
      response: { 202: { type: "object", properties: { arquivo: arquivoSchema } }, ...errorResponseSchema } },
    preHandler: allow("solicitar_espelhos_ponto"),
    handler: FtRelatorioController.solicitarEspelhosPonto,
  });

  fastify.route({
    method: "POST", url: "/edital/:id/folhas-presenca",
    config: { audit: { failureAction: "EXPORT", module: "ft-relatorio", resourceType: "lote_folha_presenca", resourceIdParam: "id" } },
    schema: { tags: relatorioTags, security: jwtSecurity, summary: "Solicitar folhas de presenca em lote", params: editalIdParamsSchema,
      body: { type: "object", additionalProperties: false, required: ["mes"], properties: { mes: { type: "string", pattern: "^\\d{4}-(0[1-9]|1[0-2])$" } } },
      response: { 202: { type: "object", properties: { arquivo: arquivoSchema } }, ...errorResponseSchema } },
    preHandler: allow("solicitar_folhas_presenca"),
    handler: FtRelatorioController.solicitarFolhasPresenca,
  });

  fastify.route({
    method: "GET", url: "/downloads",
    config: { audit: { failureAction: "LIST", module: "ft-relatorio", resourceType: "lote_espelho_ponto" } },
    schema: { tags: relatorioTags, security: jwtSecurity, summary: "Listar downloads de relatorios",
      querystring: { type: "object", additionalProperties: false, properties: { page: { type: "integer", minimum: 0 }, limit: { type: "integer", minimum: 1, maximum: 100 } } },
      response: { 200: { type: "object", properties: { arquivos: { type: "array", items: arquivoSchema }, count: { type: "number" }, page: { type: "number" }, limit: { type: "number" } } }, ...errorResponseSchema } },
    preHandler: allow("consultar_downloads"),
    handler: FtRelatorioController.listarDownloads,
  });

  fastify.route({
    method: "GET", url: "/downloads/:id",
    config: { audit: { failureAction: "EXPORT", module: "ft-relatorio", resourceType: "arquivo_espelhos_ponto", resourceIdParam: "id" } },
    schema: { tags: relatorioTags, security: jwtSecurity, summary: "Baixar arquivo de relatorios", params: downloadIdParamsSchema,
      response: { 200: { description: "Arquivo ZIP", content: { "application/zip": { schema: { type: "string", format: "binary" } } } }, ...errorResponseSchema } },
    preHandler: allow("baixar_relatorio"),
    handler: FtRelatorioController.baixarArquivo,
  });

  fastify.route({
    method: "POST", url: "/downloads/:id/retry",
    config: { audit: { failureAction: "UPDATE", module: "ft-relatorio", resourceType: "lote_espelho_ponto", resourceIdParam: "id" } },
    schema: { tags: relatorioTags, security: jwtSecurity, summary: "Tentar novamente lote com erro", params: downloadIdParamsSchema,
      response: { 202: { type: "object", properties: { arquivo: arquivoSchema } }, ...errorResponseSchema } },
    preHandler: allow("reprocessar_relatorio"),
    handler: FtRelatorioController.retryDownload,
  });
};
