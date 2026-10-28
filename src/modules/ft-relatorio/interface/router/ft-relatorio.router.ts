import { FastifyPluginAsync, FastifyRequest } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { requirePermission } from "../../../acess-controll/interface/require-permission.js";
import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import type { FtRelatorioController as FtRelatorioControllerType } from "../controller/ft-relatorio.controller.js";

const relatorioTags = ["PEAAD - Relatorio"];
const jwtSecurity = [{ JWTToken: [] }];
const editalIdParamsSchema = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string", format: "uuid" } },
};
const csvResponseSchema = {
  409: errorResponseSchema[400],
  200: {
    type: "string",
    description: "Arquivo CSV",
  },
  ...errorResponseSchema,
};
const periodoQuerySchema = {
  type: "object",
  properties: {
    versao: { type: 'string', pattern: '^[a-f0-9]{64}$' },
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

const fechamentoSchema = { type: 'object', required: ['situacao'], properties: {
  situacao: { type: 'string', enum: ['aberta', 'fechada'] }, id: { type: 'string' }, mes: { type: 'string' },
  fechado_em: { type: 'string' }, fechado_por: { type: 'string' }, responsavel: { type: 'string' },
} };

export const FtRelatorioRouter: FastifyPluginAsync<{controller?: typeof FtRelatorioControllerType}> = async (fastify, options) => {
  const FtRelatorioController = options.controller ?? (await import("../controller/ft-relatorio.controller.js")).FtRelatorioController;
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  const allow = requirePermission("ft");


  const registerCsvRoute = ({
    url,
    summary,
    description,
    querystring,
    handler,
    action,
  }: {
    url: string;
    summary: string;
    description?: string;
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
        description,
        params: editalIdParamsSchema,
        querystring,
        response: csvResponseSchema,
      },
      preHandler: allow(action),
      handler,
    });
  };

  fastify.get('/edital/:id/previa', {
    config: { audit: { failureAction: 'VIEW', module: 'ft-relatorio', resourceType: 'previa_pagamento', resourceIdParam: 'id', omitRequestedChanges: true } },
    schema: { tags: relatorioTags, security: jwtSecurity, summary: 'Conferir pagamento antes de exportar; alertas não bloqueiam', params: editalIdParamsSchema,
      querystring: { ...periodoQuerySchema, properties: { ...periodoQuerySchema.properties, page: { type: 'integer', minimum: 0 }, limit: { type: 'integer', minimum: 1, maximum: 50 } } },
      response: { 200: { type: 'object', required: ['rows', 'count', 'resumo', 'versao', 'fechamento', 'periodo', 'pode_fechar'], properties: {
        rows: { type: 'array', items: { type: 'object', properties: Object.fromEntries([
          ...['bolsista_id','bco','ag','dig_ag','conta','dig_conta','nome','cpf','pagador','data_pagamento'].map(key => [key, { type: 'string' }]),
          ['valor_liquido', { type: 'number' }], ['alertas', { type: 'array', items: { type: 'object', properties: { codigo: { type: 'string' }, campo: { type: 'string' }, mensagem: { type: 'string' } } } }],
        ]) } }, fechamento: fechamentoSchema, pode_fechar: { type: 'boolean' },
        periodo: { type: 'object', properties: { data_inicio: { type: 'string' }, data_fim: { type: 'string' } } },
        count: { type: 'integer' }, versao: { type: 'string' }, data_pagamento: { type: 'string' },
        resumo: { type: 'object', properties: Object.fromEntries(['participantes','pagamentos','valor_liquido','com_alertas'].map(key => [key, { type: 'number' }])) },
      } }, ...errorResponseSchema, 409: errorResponseSchema[400] } },
    preHandler: allow('gerar_relatorio_edital'),
  }, FtRelatorioController.previaPagamento);

  fastify.route({
    method: "GET", url: '/edital/:id/fechamento',
    config: { audit: { failureAction: 'VIEW', module: 'ft-relatorio', resourceType: 'fechamento_folha', resourceIdParam: 'id' } },
    schema: { tags: relatorioTags, security: jwtSecurity, summary: 'Consultar fechamento mensal da folha do PEAAD', params: editalIdParamsSchema,
      querystring: { ...monthQuerySchema, required: ['mes'], additionalProperties: false },
      response: { 200: fechamentoSchema, ...errorResponseSchema } },
    preHandler: allow('gerar_relatorio_edital'), handler: FtRelatorioController.consultarFechamento,
  });
  fastify.route({
    method: "POST", url: '/edital/:id/fechamento',
    config: { audit: { failureAction: 'CREATE', module: 'ft-relatorio', resourceType: 'fechamento_folha', resourceIdParam: 'id', omitRequestedChanges: true } },
    schema: { tags: relatorioTags, security: jwtSecurity, summary: 'Fechar irreversivelmente a folha mensal do PEAAD', params: editalIdParamsSchema,
      body: { type: 'object', additionalProperties: false, required: ['mes', 'versao'], properties: {
        mes: { type: 'string', pattern: '^\\d{4}-(0[1-9]|1[0-2])$' }, versao: { type: 'string', pattern: '^[a-f0-9]{64}$' },
      } }, response: { 200: fechamentoSchema, ...errorResponseSchema, 409: errorResponseSchema[400] } },
    preHandler: [allow('gerar_relatorio_edital'), allow('fechar_folha_pagamento')], handler: FtRelatorioController.fecharFolha,
  });

  registerCsvRoute({
    url: "/edital/:id",
    summary: "Baixar CSV preservado da folha mensal fechada do PEAAD",
    description: "Disponivel apenas apos fechamento mensal. Retorna o arquivo preservado, sem recalculo; exige mes completo. CSV separado por ponto e vírgula, sem cabeçalho, agrupamentos, totais ou linhas em branco. Nove campos, nesta ordem: Numero Banco;Agencia;Digito;Conta;Digito da Conta;Nome Credor;Valor;DATA do pagamento;CPF do Credor. Valor líquido em centavos inteiros, CPF somente números e dados bancários preservados como texto. Data DDMMAAAA: dia de pagamento do edital no mês da data inicial do período, limitado ao último dia válido do mês. Relatório sem pagamentos retorna conteúdo vazio. Campos com delimitador, aspas ou quebras de linha usam escape CSV.",
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
      querystring: { type: "object", additionalProperties: false, properties: { edital_id: { type: 'string', format: 'uuid' }, page: { type: "integer", minimum: 0 }, limit: { type: "integer", minimum: 1, maximum: 100 } } },
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
