import { FastifyPluginAsync, FastifyRequest } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { requirePermission } from "../../../acess-controll/interface/require-permission.js";
import type { FrenteTrabalhoBolsistaController as FrenteTrabalhoBolsistaControllerType } from "../controller/frente-de-trabalho-bolsista.controller.js";
import errorResponseSchema from "../../../../core/schema/errorSchema.js";

export const FrenteTrabalhoBolsistaRouter: FastifyPluginAsync<{controller?: typeof FrenteTrabalhoBolsistaControllerType}> = async (fastify, options) => {
  const FrenteTrabalhoBolsistaController = options.controller ?? (await import("../controller/frente-de-trabalho-bolsista.controller.js")).FrenteTrabalhoBolsistaController;
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  const allow = requirePermission("ft");


  const tag = ["Frente de Trabalho - Bolsista"];
  const security = [{ JWTToken: [] }];
  const uuidParam = {
    type: "object",
    required: ["id"],
    properties: { id: { type: "string", format: "uuid" } },
  };
  const paymentInfoSchema = {
    type: "object",
    additionalProperties: true,
    required: ["bco", "ag", "dig_ag", "conta", "dig_conta"],
    properties: {
      id: { type: "string", format: "uuid" },
      bco: { type: "string" },
      ag: { type: "string" },
      dig_ag: { type: "string" },
      conta: { type: "string" },
      dig_conta: { type: "string" },
    },
  };
  const vinculoAtualSchema = {
    anyOf: [
      {
        type: "object",
        additionalProperties: true,
        required: ["id", "edital_id", "status", "local", "data_vinculo"],
        properties: {
          id: { type: "string", format: "uuid" },
          edital_id: { type: "string", format: "uuid" },
          status: {
            type: "string",
            enum: ["ativo", "inativo", "concluido", "cancelado", "expirado"],
          },
          local: { type: "string" },
          data_vinculo: { type: "string" },
          expire_at: { anyOf: [{ type: "string" }, { type: "null" }] },
          edital: {
            type: "object",
            additionalProperties: true,
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
            },
          },
        },
      },
      { type: "null" },
    ],
  };
  const bolsistaSchema = {
    type: "object",
    additionalProperties: true,
    properties: {
      id: { type: "string", format: "uuid" },
      municipe_uuid: { type: "string", format: "uuid" },
      municipe: {
        type: "object",
        additionalProperties: true,
        properties: {
          uuid: { type: "string", format: "uuid" },
          nome: { type: "string" },
          cpf: { type: "string" },
          nascimento: { anyOf: [{ type: "string" }, { type: "null" }] },
          telefone: { anyOf: [{ type: "string" }, { type: "null" }] },
          rua: { type: "string" },
          bairro: { type: "string" },
          cidade: { type: "string" },
          uf: { type: "string" },
          cep: { type: "string" },
          numero: { type: "string" },
          complemento: { anyOf: [{ type: "string" }, { type: "null" }] },
        },
      },
      payment_info: paymentInfoSchema,
      vinculo_atual: vinculoAtualSchema,
      bolsistas_edital: { type: "array", items: vinculoAtualSchema.anyOf[0] },
      createdAt: { type: "string" },
      updatedAt: { type: "string" },
    },
  };
  const bolsistaBodySchema = {
    type: "object",
    required: ["bolsista"],
    properties: {
      bolsista: {
        type: "object",
        additionalProperties: true,
        required: ["municipe_uuid", "payment_info"],
        properties: {
          municipe_uuid: { type: "string", format: "uuid" },
          payment_info: paymentInfoSchema,
        },
      },
    },
  };
  const bolsistaUpdateBodySchema = {
    type: "object",
    additionalProperties: false,
    required: ["bolsista"],
    properties: {
      bolsista: {
        type: "object",
        additionalProperties: false,
        required: ["payment_info"],
        properties: { payment_info: paymentInfoSchema },
      },
    },
  };
  const faltaSchema = {
    type: "object",
    additionalProperties: true,
    properties: {
      id: { type: "string", format: "uuid" },
      bolsista_id: { type: "string", format: "uuid" },
      edital_id: { type: "string", format: "uuid" },
      data_falta: { type: "string", format: "date" },
      observacao: { type: "string" },
      edital: {
        type: "object",
        additionalProperties: true,
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
        },
      },
    },
  };
  const ocorrenciaSchema = {
    type: "object",
    additionalProperties: true,
    properties: {
      id: { type: "string", format: "uuid" },
      bolsista_edital_id: { type: "string", format: "uuid" },
      data_ocorrencia: { type: "string", format: "date" },
      descricao: { type: "string" },
      author_id: { type: "integer" },
      vinculo: { type: "object", additionalProperties: true },
      author: { type: "object", additionalProperties: true },
    },
  };

  fastify.route({
    method: "GET",
    url: "/",
    config: {
      audit: {
        failureAction: "LIST",
        module: "ft-bolsista",
        resourceType: "bolsista",
      },
    },
    schema: {
      tags: tag,
      security,
      summary: "Listar bolsistas",
      querystring: {
        type: "object",
        properties: {
          page: { type: "string" },
          limit: { type: "string" },
          search: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            ok: { type: "boolean" },
            count: { type: "number" },
            bolsista: { type: "array", items: bolsistaSchema },
          },
        },
        ...errorResponseSchema,
      },
    },
    preHandler: allow("consultar_bolsista"),
    handler: FrenteTrabalhoBolsistaController.getBolsistas,
  });

  fastify.route({
    method: "GET",
    url: "/:id/espelho-ponto",
    config: {
      audit: {
        failureAction: "EXPORT",
        module: "ft-bolsista",
        resourceType: "espelho_ponto",
        resourceIdParam: "id",
      },
    },
    schema: {
      tags: tag,
      security,
      summary: "Gerar espelho de ponto mensal do bolsista",
      params: uuidParam,
      querystring: {
        type: "object",
        additionalProperties: false,
        required: ["edital_id", "mes"],
        properties: {
          edital_id: { type: "string", format: "uuid" },
          mes: { type: "string", pattern: "^\\d{4}-(0[1-9]|1[0-2])$" },
        },
      },
      response: {
        200: {
          description: "Espelho de ponto em PDF",
          content: {
            "application/pdf": { schema: { type: "string", format: "binary" } },
          },
        },
        ...errorResponseSchema,
      },
    },
    preHandler: allow("gerar_espelho_ponto"),
    handler: FrenteTrabalhoBolsistaController.gerarEspelhoPonto,
  });

  fastify.route({
    method: "POST",
    url: "/",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-bolsista",
        resourceType: "bolsista",
      },
    },
    schema: {
      tags: tag,
      security,
      summary: "Criar bolsista",
      body: bolsistaBodySchema,
      response: {
        200: {
          type: "object",
          additionalProperties: true,
          properties: {
            ...bolsistaSchema.properties,
            ok: { type: "boolean" },
            message: { type: "string" },
          },
        },
        ...errorResponseSchema,
      },
    },
    preHandler: allow("cadastrar_bolsista"),
    handler: FrenteTrabalhoBolsistaController.createBolsista,
  });

  fastify.route({
    method: "GET",
    url: "/vinculo-candidates",
    config: {
      audit: {
        failureAction: "LIST",
        module: "ft-bolsista",
        resourceType: "bolsista",
      },
    },
    schema: {
      tags: tag,
      security,
      summary: "Listar bolsistas elegiveis para vinculo",
      querystring: {
        type: "object",
        required: ["edital_id", "data_vinculo"],
        properties: {
          limit: { type: "string", pattern: "^(?:[1-9]|[1-4][0-9]|50)$" },
          search: { type: "string" },
          edital_id: { type: "string", format: "uuid" },
          data_vinculo: { type: "string", format: "date" },
          cursor: { type: "string", maxLength: 1024 },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            ok: { type: "boolean" },
            returned_count: { type: "number" },
            has_more: { type: "boolean" },
            next_cursor: { anyOf: [{ type: "string" }, { type: "null" }] },
            bolsistas: { type: "array", items: bolsistaSchema },
          },
        },
        ...errorResponseSchema,
      },
    },
    preHandler: allow("consultar_candidatos_vinculo"),
    handler: FrenteTrabalhoBolsistaController.getBolsistasParaVinculo,
  });

  fastify.route({
    method: "GET",
    url: "/aniversariantes",
    config: {
      audit: {
        failureAction: "LIST",
        module: "ft-bolsista",
        resourceType: "aniversariante",
      },
    },
    schema: {
      tags: tag,
      security,
      summary: "Listar aniversariantes ativos do mes",
      querystring: {
        type: "object",
        properties: { mes: { type: "string", pattern: "^(?:[1-9]|1[0-2])$" } },
      },
      response: {
        200: {
          type: "object",
          properties: {
            aniversariantes: {
              type: "array",
              items: { type: "object", additionalProperties: true },
            },
            count: { type: "number" },
            mes: { type: "number" },
          },
        },
        ...errorResponseSchema,
      },
    },
    preHandler: allow("consultar_aniversariantes"),
    handler: FrenteTrabalhoBolsistaController.getAniversariantes,
  });

  fastify.route({
    method: "GET",
    url: "/toexpire",
    config: {
      audit: {
        failureAction: "LIST",
        module: "ft-bolsista",
        resourceType: "bolsista",
      },
    },
    schema: {
      tags: tag,
      security,
      summary: "Listar vínculos de bolsistas a vencer",
      response: {
        200: {
          type: "object",
          properties: {
            mesasge: { type: "string" },
            count: { type: "number" },
            bolsistas: {
              type: "array",
              items: { type: "object", additionalProperties: true },
            },
          },
        },
        ...errorResponseSchema,
      },
    },
    preHandler: allow("consultar_vinculos_a_vencer"),
    handler: FrenteTrabalhoBolsistaController.getToExpire,
  });

  fastify.route({
    method: "GET",
    url: "/toExpire",
    config: {
      audit: {
        failureAction: "LIST",
        module: "ft-bolsista",
        resourceType: "bolsista",
      },
    },
    schema: { hide: true },
    preHandler: allow("consultar_vinculos_a_vencer"),
    handler: FrenteTrabalhoBolsistaController.getToExpire,
  });

  fastify.route({
    method: "PUT",
    url: "/prorrogate",
    config: {
      audit: {
        failureAction: "UPDATE",
        module: "ft-bolsista",
        resourceType: "vinculo",
      },
    },
    schema: {
      tags: tag,
      security,
      summary: "Prorrogar vínculos de bolsistas",
      body: {
        type: "object",
        required: ["bolsistas"],
        properties: {
          bolsistas: {
            type: "array",
            items: {
              type: "object",
              required: ["bolsista_id", "edital_id"],
              properties: {
                bolsista_id: { type: "string", format: "uuid" },
                edital_id: { type: "string", format: "uuid" },
              },
            },
          },
        },
      },
      response: {
        201: {
          type: "object",
          properties: { message: { type: "string" } },
        },
        ...errorResponseSchema,
      },
    },
    preHandler: allow("prorrogar_vinculo"),
    handler: FrenteTrabalhoBolsistaController.prorrogate,
  });

  fastify.route({
    method: "GET",
    url: "/edital/:id",
    config: {
      audit: {
        failureAction: "LIST",
        module: "ft-bolsista",
        resourceType: "edital_bolsista",
        resourceIdParam: "id",
      },
    },
    schema: {
      tags: tag,
      security,
      summary: "Listar bolsistas de um edital",
      params: uuidParam,
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            bolsista: { type: "array", items: bolsistaSchema },
          },
        },
        ...errorResponseSchema,
      },
    },
    preHandler: allow("consultar_vinculos"),
    handler: FrenteTrabalhoBolsistaController.getBolsistaEdital,
  });

  fastify.route({
    method: "GET",
    url: "/:id/historico",
    config: {
      audit: {
        failureAction: "LIST",
        module: "ft-bolsista",
        resourceType: "historico_bolsista",
        resourceIdParam: "id",
      },
    },
    schema: {
      tags: tag,
      security,
      summary: "Listar historico de vinculos do bolsista",
      params: uuidParam,
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            ok: { type: "boolean" },
            historico: {
              type: "array",
              items: { type: "object", additionalProperties: true },
            },
          },
        },
        ...errorResponseSchema,
      },
    },
    preHandler: allow("consultar_historico_bolsista"),
    handler: FrenteTrabalhoBolsistaController.getHistoricoBolsista,
  });

  fastify.route({
    method: "GET",
    url: "/:id",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-bolsista",
        resourceType: "bolsista",
        resourceIdParam: "id",
      },
    },
    schema: {
      tags: tag,
      security,
      summary: "Buscar bolsista por id",
      params: uuidParam,
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            bolsista: bolsistaSchema,
          },
        },
        ...errorResponseSchema,
      },
    },
    preHandler: allow("consultar_bolsista"),
    handler: FrenteTrabalhoBolsistaController.getOneBolsista,
  });

  fastify.route({
    method: "PUT",
    url: "/:id",
    config: {
      audit: {
        failureAction: "UPDATE",
        module: "ft-bolsista",
        resourceType: "bolsista",
        resourceIdParam: "id",
      },
    },
    schema: {
      tags: tag,
      security,
      summary: "Atualizar bolsista",
      params: uuidParam,
      body: bolsistaUpdateBodySchema,
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            bolsista: bolsistaSchema,
          },
        },
        ...errorResponseSchema,
      },
    },
    preHandler: allow("editar_bolsista"),
    handler: FrenteTrabalhoBolsistaController.updateBolsista,
  });

  fastify.route({
    method: "DELETE",
    url: "/:id",
    config: {
      audit: {
        failureAction: "DELETE",
        module: "ft-bolsista",
        resourceType: "bolsista",
        resourceIdParam: "id",
      },
    },
    schema: {
      tags: tag,
      security,
      summary: "Remover bolsista",
      params: uuidParam,
      response: {
        200: {
          type: "object",
          properties: { message: { type: "string" } },
        },
        ...errorResponseSchema,
      },
    },
    preHandler: allow("excluir_bolsista"),
    handler: FrenteTrabalhoBolsistaController.deleteBolsista,
  });

  fastify.route({
    method: "PUT",
    url: "/:bolsista/edital/:edital",
    config: {
      audit: {
        failureAction: "UPDATE",
        module: "ft-bolsista",
        resourceType: "vinculo",
        resourceIdParam: "bolsista",
      },
    },
    schema: {
      tags: tag,
      security,
      summary: "Cancelar vínculo do bolsista com edital",
      params: {
        type: "object",
        required: ["bolsista", "edital"],
        properties: {
          bolsista: { type: "string", format: "uuid" },
          edital: { type: "string", format: "uuid" },
        },
      },
      body: {
        type: "object",
        required: ["observacao"],
        additionalProperties: false,
        properties: {
          observacao: { type: "string", minLength: 1, pattern: "\\S" },
        },
      },
      response: {
        201: {
          type: "object",
          properties: { message: { type: "string" } },
        },
        ...errorResponseSchema,
      },
    },
    preHandler: allow("remover_bolsista"),
    handler: FrenteTrabalhoBolsistaController.cancelBolsistaEdital,
  });

  fastify.route({
    method: "POST",
    url: "/:id/faltas",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-bolsista",
        resourceType: "falta",
        resourceIdParam: "id",
      },
    },
    schema: {
      tags: tag,
      security,
      summary: "Lançar falta para bolsista",
      params: uuidParam,
      body: {
        type: "object",
        required: ["edital_id", "data_falta"],
        properties: {
          edital_id: { type: "string", format: "uuid" },
          data_falta: { type: "string", format: "date" },
          observacao: { type: "string" },
        },
      },
      response: {
        201: {
          type: "object",
          properties: {
            message: { type: "string" },
            falta: faltaSchema,
            ok: { type: "boolean" },
          },
        },
        ...errorResponseSchema,
      },
    },
    preHandler: allow("registrar_falta"),
    handler: FrenteTrabalhoBolsistaController.createFalta,
  });

  fastify.route({
    method: "GET",
    url: "/:id/faltas",
    config: {
      audit: {
        failureAction: "LIST",
        module: "ft-bolsista",
        resourceType: "falta",
        resourceIdParam: "id",
      },
    },
    schema: {
      tags: tag,
      security,
      summary: "Listar faltas do bolsista",
      params: uuidParam,
      querystring: {
        type: "object",
        properties: {
          edital_id: { type: "string", format: "uuid" },
          data_inicio: { type: "string", format: "date" },
          data_fim: { type: "string", format: "date" },
          page: { type: "string" },
          limit: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            faltas: { type: "array", items: faltaSchema },
            count: { type: "number" },
            ok: { type: "boolean" },
          },
        },
        ...errorResponseSchema,
      },
    },
    preHandler: allow("consultar_faltas"),
    handler: FrenteTrabalhoBolsistaController.listFaltas,
  });

  fastify.route({
    method: "DELETE",
    url: "/:id/faltas/:faltaId",
    config: {
      audit: {
        failureAction: "DELETE",
        module: "ft-bolsista",
        resourceType: "falta",
        resourceIdParam: "faltaId",
      },
    },
    schema: {
      tags: tag,
      security,
      summary: "Remover falta do bolsista",
      params: {
        type: "object",
        required: ["id", "faltaId"],
        properties: {
          id: { type: "string", format: "uuid" },
          faltaId: { type: "string", format: "uuid" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            ok: { type: "boolean" },
          },
        },
        ...errorResponseSchema,
      },
    },
    preHandler: allow("excluir_falta"),
    handler: FrenteTrabalhoBolsistaController.deleteFalta,
  });

  fastify.route({
    method: "POST",
    url: "/:id/ocorrencias",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-bolsista",
        resourceType: "ocorrencia",
        resourceIdParam: "id",
      },
    },
    schema: {
      tags: tag,
      security,
      summary: "Registrar ocorrencia no historico do bolsista",
      params: uuidParam,
      body: {
        type: "object",
        additionalProperties: false,
        required: ["bolsista_edital_id", "data_ocorrencia", "descricao"],
        properties: {
          bolsista_edital_id: { type: "string", format: "uuid" },
          data_ocorrencia: { type: "string", format: "date" },
          descricao: {
            type: "string",
            minLength: 1,
            maxLength: 2000,
            pattern: "\\S",
          },
        },
      },
      response: {
        201: {
          type: "object",
          properties: {
            message: { type: "string" },
            ocorrencia: ocorrenciaSchema,
            ok: { type: "boolean" },
          },
        },
        ...errorResponseSchema,
      },
    },
    preHandler: allow("registrar_ocorrencia"),
    handler: FrenteTrabalhoBolsistaController.createOcorrencia,
  });

  fastify.route({
    method: "GET",
    url: "/:id/ocorrencias",
    config: {
      audit: {
        failureAction: "LIST",
        module: "ft-bolsista",
        resourceType: "ocorrencia",
        resourceIdParam: "id",
      },
    },
    schema: {
      tags: tag,
      security,
      summary: "Listar ocorrencias do bolsista",
      params: uuidParam,
      querystring: {
        type: "object",
        properties: {
          bolsista_edital_id: { type: "string", format: "uuid" },
          edital_id: { type: "string", format: "uuid" },
          page: { type: "string", pattern: "^\\d+$" },
          limit: { type: "string", pattern: "^(?:[1-9]|[1-9]\\d|100)$" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            ocorrencias: { type: "array", items: ocorrenciaSchema },
            count: { type: "number" },
            ok: { type: "boolean" },
          },
        },
        ...errorResponseSchema,
      },
    },
    preHandler: allow("consultar_ocorrencias"),
    handler: FrenteTrabalhoBolsistaController.listOcorrencias,
  });

  fastify.route({
    method: "DELETE",
    url: "/:id/ocorrencias/:ocorrenciaId",
    config: {
      audit: {
        failureAction: "DELETE",
        module: "ft-bolsista",
        resourceType: "ocorrencia",
        resourceIdParam: "ocorrenciaId",
      },
    },
    schema: {
      tags: tag,
      security,
      summary: "Remover ocorrencia do bolsista",
      params: {
        type: "object",
        required: ["id", "ocorrenciaId"],
        properties: {
          id: { type: "string", format: "uuid" },
          ocorrenciaId: { type: "string", format: "uuid" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: { message: { type: "string" }, ok: { type: "boolean" } },
        },
        ...errorResponseSchema,
      },
    },
    preHandler: allow("excluir_ocorrencia"),
    handler: FrenteTrabalhoBolsistaController.deleteOcorrencia,
  });
};
