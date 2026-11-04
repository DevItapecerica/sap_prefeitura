import type { FastifyPluginAsync } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { requirePermission } from "../../../acess-controll/interface/require-permission.js";
import errorResponseSchema from "../../../../core/schema/errorSchema.js";
import { configureBodyValidation } from "../../../../infra/http/fastify/body-validation.js";
import { EditalWorkflowController } from "../controller/edital-workflow.controller.js";
import type {
  WorkflowQuery,
  WorkflowInput,
  EditalInput,
  ConfigInput,
  DatedInput,
} from "../../domain/repositories/workflow.repository.js";
import type { Answers } from "../../domain/services/edital-workflow.policy.js";
import {
  uuid,
  object,
  item,
  itemRef,
  collection,
  query,
  payerBody,
  shiftBody,
  configBody,
  registrationBody,
  exceptionBody,
  callBody,
  callExceptionBody,
  activationBody,
  reasonBody,
  allocationBody,
  emptyBody,
  editalBody,
  windowBody,
  absenceBody,
  occurrenceBody,
  prevalidationBody,
  pdfQuery,
  pdfResponse,
} from "../schema/edital-workflow.schema.js";
type RegistrationInput = {
  municipe_uuid: string;
  respostas: Answers;
  motivo?: string;
};
export const EditalWorkflowRouter: FastifyPluginAsync<{
  controller?: EditalWorkflowController;
}> = async (fastify, options) => {
  fastify.addSchema({ $id: "FtWorkflowItem", ...item });
  const controller =
    options.controller ??
    (
      await import("../../factories/makeEditalWorkflowController.js")
    ).makeEditalWorkflowController();
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  configureBodyValidation(fastify, {
    extraField: (field) => "Campo nao permitido: " + field,
    invalidType: "Tipo de campo invalido",
  });
  const allow = requirePermission("ft");

  fastify.route<{ Params: {}; Querystring: WorkflowQuery; Body: never }>({
    method: "GET",
    url: "/",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "consultar edital",
      security: [{ JWTToken: [] }],
      querystring: query,
      response: {
        200: collection,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("consultar_edital"),
    handler: controller.list,
  });

  fastify.route<{ Params: {}; Querystring: WorkflowQuery; Body: EditalInput }>({
    method: "POST",
    url: "/",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "cadastrar edital",
      security: [{ JWTToken: [] }],
      body: editalBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("cadastrar_edital"),
    handler: controller.create,
  });

  fastify.route<{
    Params: { id: string };
    Querystring: WorkflowQuery;
    Body: never;
  }>({
    method: "GET",
    url: "/:id",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "consultar edital",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      querystring: query,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("consultar_edital"),
    handler: controller.detail,
  });

  fastify.route<{
    Params: { id: string };
    Querystring: WorkflowQuery;
    Body: EditalInput;
  }>({
    method: "PUT",
    url: "/:id",
    config: {
      audit: {
        failureAction: "UPDATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "editar edital",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      body: editalBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("editar_edital"),
    handler: controller.update,
  });

  fastify.route<{
    Params: { id: string };
    Querystring: WorkflowQuery;
    Body: { inscricoes_inicio: string; inscricoes_fim: string; motivo: string };
  }>({
    method: "PUT",
    url: "/:id/janela-inscricoes",
    config: {
      audit: {
        failureAction: "UPDATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "alterar janela inscricoes",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      body: windowBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("alterar_janela_inscricoes"),
    handler: controller.window,
  });

  fastify.route<{
    Params: { id: string };
    Querystring: WorkflowQuery;
    Body: never;
  }>({
    method: "POST",
    url: "/:id/abrir",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "editar edital",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("editar_edital"),
    handler: controller.open,
  });

  fastify.route<{
    Params: { id: string };
    Querystring: WorkflowQuery;
    Body: never;
  }>({
    method: "POST",
    url: "/:id/encerrar",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "encerrar edital",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("encerrar_edital"),
    handler: controller.close,
  });

  fastify.route<{
    Params: { id: string };
    Querystring: WorkflowQuery;
    Body: never;
  }>({
    method: "GET",
    url: "/:id/pagadores",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "consultar pagador",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      querystring: query,
      response: {
        200: collection,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("consultar_pagador"),
    handler: controller.list_pagadores,
  });

  fastify.route<{
    Params: { id: string };
    Querystring: WorkflowQuery;
    Body: ConfigInput;
  }>({
    method: "POST",
    url: "/:id/pagadores",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "cadastrar pagador",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      body: payerBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("cadastrar_pagador"),
    handler: controller.create_pagadores,
  });

  fastify.route<{
    Params: { id: string; itemId: string };
    Querystring: WorkflowQuery;
    Body: ConfigInput;
  }>({
    method: "PUT",
    url: "/:id/pagadores/:itemId",
    config: {
      audit: {
        failureAction: "UPDATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "editar pagador",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid, itemId: uuid }),
      body: payerBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("editar_pagador"),
    handler: controller.update_pagadores,
  });

  fastify.route<{
    Params: { id: string; itemId: string };
    Querystring: WorkflowQuery;
    Body: never;
  }>({
    method: "DELETE",
    url: "/:id/pagadores/:itemId",
    config: {
      audit: {
        failureAction: "UPDATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "excluir pagador",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid, itemId: uuid }),
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("excluir_pagador"),
    handler: controller.remove_pagadores,
  });

  fastify.route<{
    Params: { id: string };
    Querystring: WorkflowQuery;
    Body: never;
  }>({
    method: "GET",
    url: "/:id/turnos",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "consultar turno",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      querystring: query,
      response: {
        200: collection,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("consultar_turno"),
    handler: controller.list_turnos,
  });

  fastify.route<{
    Params: { id: string };
    Querystring: WorkflowQuery;
    Body: ConfigInput;
  }>({
    method: "POST",
    url: "/:id/turnos",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "cadastrar turno",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      body: shiftBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("cadastrar_turno"),
    handler: controller.create_turnos,
  });

  fastify.route<{
    Params: { id: string; itemId: string };
    Querystring: WorkflowQuery;
    Body: ConfigInput;
  }>({
    method: "PUT",
    url: "/:id/turnos/:itemId",
    config: {
      audit: {
        failureAction: "UPDATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "editar turno",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid, itemId: uuid }),
      body: shiftBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("editar_turno"),
    handler: controller.update_turnos,
  });

  fastify.route<{
    Params: { id: string; itemId: string };
    Querystring: WorkflowQuery;
    Body: never;
  }>({
    method: "DELETE",
    url: "/:id/turnos/:itemId",
    config: {
      audit: {
        failureAction: "UPDATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "excluir turno",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid, itemId: uuid }),
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("excluir_turno"),
    handler: controller.remove_turnos,
  });

  fastify.route<{
    Params: { id: string };
    Querystring: WorkflowQuery;
    Body: never;
  }>({
    method: "GET",
    url: "/:id/locais",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "consultar configuracao edital",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      querystring: query,
      response: {
        200: collection,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("consultar_configuracao_edital"),
    handler: controller.list_locais,
  });

  fastify.route<{
    Params: { id: string };
    Querystring: WorkflowQuery;
    Body: ConfigInput;
  }>({
    method: "POST",
    url: "/:id/locais",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "editar configuracao edital",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      body: configBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("editar_configuracao_edital"),
    handler: controller.create_locais,
  });

  fastify.route<{
    Params: { id: string; itemId: string };
    Querystring: WorkflowQuery;
    Body: ConfigInput;
  }>({
    method: "PUT",
    url: "/:id/locais/:itemId",
    config: {
      audit: {
        failureAction: "UPDATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "editar configuracao edital",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid, itemId: uuid }),
      body: configBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("editar_configuracao_edital"),
    handler: controller.update_locais,
  });

  fastify.route<{
    Params: { id: string; itemId: string };
    Querystring: WorkflowQuery;
    Body: never;
  }>({
    method: "DELETE",
    url: "/:id/locais/:itemId",
    config: {
      audit: {
        failureAction: "UPDATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "editar configuracao edital",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid, itemId: uuid }),
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("editar_configuracao_edital"),
    handler: controller.remove_locais,
  });

  fastify.route<{
    Params: { id: string };
    Querystring: WorkflowQuery;
    Body: never;
  }>({
    method: "GET",
    url: "/:id/beneficios",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "consultar configuracao edital",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      querystring: query,
      response: {
        200: collection,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("consultar_configuracao_edital"),
    handler: controller.list_beneficios,
  });

  fastify.route<{
    Params: { id: string };
    Querystring: WorkflowQuery;
    Body: ConfigInput;
  }>({
    method: "POST",
    url: "/:id/beneficios",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "editar configuracao edital",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      body: configBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("editar_configuracao_edital"),
    handler: controller.create_beneficios,
  });

  fastify.route<{
    Params: { id: string; itemId: string };
    Querystring: WorkflowQuery;
    Body: ConfigInput;
  }>({
    method: "PUT",
    url: "/:id/beneficios/:itemId",
    config: {
      audit: {
        failureAction: "UPDATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "editar configuracao edital",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid, itemId: uuid }),
      body: configBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("editar_configuracao_edital"),
    handler: controller.update_beneficios,
  });

  fastify.route<{
    Params: { id: string; itemId: string };
    Querystring: WorkflowQuery;
    Body: never;
  }>({
    method: "DELETE",
    url: "/:id/beneficios/:itemId",
    config: {
      audit: {
        failureAction: "UPDATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "editar configuracao edital",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid, itemId: uuid }),
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("editar_configuracao_edital"),
    handler: controller.remove_beneficios,
  });

  fastify.route<{
    Params: { id: string };
    Querystring: WorkflowQuery;
    Body: never;
  }>({
    method: "GET",
    url: "/:id/inscricoes",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "consultar inscricoes",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      querystring: query,
      response: {
        200: collection,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("consultar_inscricoes"),
    handler: controller.inscriptions,
  });

  fastify.route<{
    Params: { id: string; inscricaoId: string };
    Querystring: WorkflowQuery;
    Body: never;
  }>({
    method: "GET",
    url: "/:id/inscricoes/:inscricaoId/historico",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "consultar inscricoes",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid, inscricaoId: uuid }),
      querystring: query,
      response: {
        200: collection,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("consultar_inscricoes"),
    handler: controller.inscriptionHistory,
  });

  fastify.route<{
    Params: { id: string; participacaoId: string };
    Querystring: WorkflowQuery;
    Body: never;
  }>({
    method: "GET",
    url: "/:id/participacoes/:participacaoId/historico",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "consultar vinculos",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid, participacaoId: uuid }),
      querystring: query,
      response: {
        200: collection,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("consultar_vinculos"),
    handler: controller.participationHistory,
  });

  fastify.route<{
    Params: { id: string };
    Querystring: WorkflowQuery;
    Body: WorkflowInput;
  }>({
    method: "POST",
    url: "/:id/prevalidacoes/inscricao",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "cadastrar inscricao",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      body: prevalidationBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("cadastrar_inscricao"),
    handler: controller.prevalidate_inscricao,
  });

  fastify.route<{
    Params: { id: string };
    Querystring: WorkflowQuery;
    Body: WorkflowInput;
  }>({
    method: "POST",
    url: "/:id/prevalidacoes/inscricao-encaixe",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "encaixar inscricao",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      body: prevalidationBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("encaixar_inscricao"),
    handler: controller.prevalidate_inscricao_encaixe,
  });

  fastify.route<{
    Params: { id: string };
    Querystring: WorkflowQuery;
    Body: WorkflowInput;
  }>({
    method: "POST",
    url: "/:id/prevalidacoes/inscricao-excecao",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "cadastrar inscricao excecao",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      body: prevalidationBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("cadastrar_inscricao_excecao"),
    handler: controller.prevalidate_inscricao_excecao,
  });

  fastify.route<{
    Params: { id: string };
    Querystring: WorkflowQuery;
    Body: WorkflowInput;
  }>({
    method: "POST",
    url: "/:id/prevalidacoes/convocacao",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "convocar inscrito",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      body: prevalidationBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("convocar_inscrito"),
    handler: controller.prevalidate_convocacao,
  });

  fastify.route<{
    Params: { id: string };
    Querystring: WorkflowQuery;
    Body: WorkflowInput;
  }>({
    method: "POST",
    url: "/:id/prevalidacoes/convocacao-excecao",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "convocar inscrito excecao",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      body: prevalidationBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("convocar_inscrito_excecao"),
    handler: controller.prevalidate_convocacao_excecao,
  });

  fastify.route<{
    Params: { id: string };
    Querystring: WorkflowQuery;
    Body: WorkflowInput;
  }>({
    method: "POST",
    url: "/:id/prevalidacoes/ativacao",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "ativar participacao",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      body: prevalidationBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("ativar_participacao"),
    handler: controller.prevalidate_ativacao,
  });

  fastify.route<{
    Params: { id: string };
    Querystring: WorkflowQuery;
    Body: WorkflowInput;
  }>({
    method: "POST",
    url: "/:id/prevalidacoes/prorrogacao",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "prorrogar vinculo",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      body: prevalidationBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("prorrogar_vinculo"),
    handler: controller.prevalidate_prorrogacao,
  });

  fastify.route<{
    Params: { id: string };
    Querystring: WorkflowQuery;
    Body: RegistrationInput;
  }>({
    method: "POST",
    url: "/:id/inscricoes",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "cadastrar inscricao",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      body: registrationBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("cadastrar_inscricao"),
    handler: controller.register,
  });

  fastify.route<{
    Params: { id: string };
    Querystring: WorkflowQuery;
    Body: RegistrationInput;
  }>({
    method: "POST",
    url: "/:id/inscricoes/encaixe",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "encaixar inscricao",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      body: exceptionBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("encaixar_inscricao"),
    handler: controller.registerEncaixe,
  });

  fastify.route<{
    Params: { id: string };
    Querystring: WorkflowQuery;
    Body: RegistrationInput;
  }>({
    method: "POST",
    url: "/:id/inscricoes/excecao",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "cadastrar inscricao excecao",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      body: exceptionBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("cadastrar_inscricao_excecao"),
    handler: controller.registerException,
  });

  fastify.route<{
    Params: { id: string; inscricaoId: string };
    Querystring: WorkflowQuery;
    Body: WorkflowInput;
  }>({
    method: "POST",
    url: "/:id/inscricoes/:inscricaoId/convocar",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "convocar inscrito",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid, inscricaoId: uuid }),
      body: callBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("convocar_inscrito"),
    handler: controller.call,
  });

  fastify.route<{
    Params: { id: string; inscricaoId: string };
    Querystring: WorkflowQuery;
    Body: WorkflowInput;
  }>({
    method: "POST",
    url: "/:id/inscricoes/:inscricaoId/convocar-excecao",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "convocar inscrito excecao",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid, inscricaoId: uuid }),
      body: callExceptionBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("convocar_inscrito_excecao"),
    handler: controller.callException,
  });

  fastify.route<{
    Params: { id: string };
    Querystring: WorkflowQuery;
    Body: never;
  }>({
    method: "GET",
    url: "/:id/participacoes",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "consultar vinculos",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid }),
      querystring: query,
      response: {
        200: collection,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("consultar_vinculos"),
    handler: controller.participations,
  });

  fastify.route<{
    Params: { id: string; participacaoId: string };
    Querystring: WorkflowQuery;
    Body: WorkflowInput;
  }>({
    method: "POST",
    url: "/:id/participacoes/:participacaoId/ativar",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "ativar participacao",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid, participacaoId: uuid }),
      body: activationBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("ativar_participacao"),
    handler: controller.ativar,
  });

  fastify.route<{
    Params: { id: string; participacaoId: string };
    Querystring: WorkflowQuery;
    Body: WorkflowInput;
  }>({
    method: "POST",
    url: "/:id/participacoes/:participacaoId/cancelar",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "cancelar participacao",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid, participacaoId: uuid }),
      body: reasonBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("cancelar_participacao"),
    handler: controller.cancelar,
  });

  fastify.route<{
    Params: { id: string; participacaoId: string };
    Querystring: WorkflowQuery;
    Body: WorkflowInput;
  }>({
    method: "POST",
    url: "/:id/participacoes/:participacaoId/concluir",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "cancelar participacao",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid, participacaoId: uuid }),
      body: reasonBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("cancelar_participacao"),
    handler: controller.concluir,
  });

  fastify.route<{
    Params: { id: string; participacaoId: string };
    Querystring: WorkflowQuery;
    Body: WorkflowInput;
  }>({
    method: "POST",
    url: "/:id/participacoes/:participacaoId/prorrogar",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "prorrogar vinculo",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid, participacaoId: uuid }),
      body: emptyBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("prorrogar_vinculo"),
    handler: controller.prorrogar,
  });

  fastify.route<{
    Params: { id: string; participacaoId: string };
    Querystring: WorkflowQuery;
    Body: WorkflowInput;
  }>({
    method: "POST",
    url: "/:id/participacoes/:participacaoId/alocar",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "editar vinculo",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid, participacaoId: uuid }),
      body: allocationBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("editar_vinculo"),
    handler: controller.alocar,
  });

  fastify.route<{
    Params: { id: string; participacaoId: string };
    Querystring: WorkflowQuery;
    Body: never;
  }>({
    method: "GET",
    url: "/:id/participacoes/:participacaoId/faltas",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "consultar faltas",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid, participacaoId: uuid }),
      querystring: query,
      response: {
        200: collection,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("consultar_faltas"),
    handler: controller.list_faltas,
  });

  fastify.route<{
    Params: { id: string; participacaoId: string };
    Querystring: WorkflowQuery;
    Body: DatedInput;
  }>({
    method: "POST",
    url: "/:id/participacoes/:participacaoId/faltas",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "registrar falta",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid, participacaoId: uuid }),
      body: absenceBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("registrar_falta"),
    handler: controller.create_faltas,
  });

  fastify.route<{
    Params: { id: string; participacaoId: string; itemId: string };
    Querystring: WorkflowQuery;
    Body: never;
  }>({
    method: "DELETE",
    url: "/:id/participacoes/:participacaoId/faltas/:itemId",
    config: {
      audit: {
        failureAction: "UPDATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "excluir falta",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid, participacaoId: uuid, itemId: uuid }),
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("excluir_falta"),
    handler: controller.remove_faltas,
  });

  fastify.route<{
    Params: { id: string; participacaoId: string };
    Querystring: WorkflowQuery;
    Body: never;
  }>({
    method: "GET",
    url: "/:id/participacoes/:participacaoId/ocorrencias",
    config: {
      audit: {
        failureAction: "VIEW",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "consultar ocorrencias",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid, participacaoId: uuid }),
      querystring: query,
      response: {
        200: collection,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("consultar_ocorrencias"),
    handler: controller.list_ocorrencias,
  });

  fastify.route<{
    Params: { id: string; participacaoId: string };
    Querystring: WorkflowQuery;
    Body: DatedInput;
  }>({
    method: "POST",
    url: "/:id/participacoes/:participacaoId/ocorrencias",
    config: {
      audit: {
        failureAction: "CREATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "registrar ocorrencia",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid, participacaoId: uuid }),
      body: occurrenceBody,
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("registrar_ocorrencia"),
    handler: controller.create_ocorrencias,
  });

  fastify.route<{
    Params: { id: string; participacaoId: string; itemId: string };
    Querystring: WorkflowQuery;
    Body: never;
  }>({
    method: "DELETE",
    url: "/:id/participacoes/:participacaoId/ocorrencias/:itemId",
    config: {
      audit: {
        failureAction: "UPDATE",
        module: "ft-edital",
        resourceType: "edital_workflow",
        resourceIdParam: "id",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "excluir ocorrencia",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid, participacaoId: uuid, itemId: uuid }),
      response: {
        200: itemRef,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("excluir_ocorrencia"),
    handler: controller.remove_ocorrencias,
  });

  fastify.route<{
    Params: { id: string; participacaoId: string };
    Querystring: { mes: string };
    Body: never;
  }>({
    method: "GET",
    url: "/:id/participacoes/:participacaoId/espelho-ponto",
    config: {
      audit: {
        failureAction: "EXPORT",
        module: "ft-edital",
        resourceType: "participacao_pdf",
        resourceIdParam: "participacaoId",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "gerar espelho ponto",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid, participacaoId: uuid }),
      querystring: pdfQuery,
      response: {
        200: pdfResponse,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("gerar_espelho_ponto"),
    handler: controller.timeSheet,
  });

  fastify.route<{
    Params: { id: string; participacaoId: string };
    Querystring: { mes: string };
    Body: never;
  }>({
    method: "GET",
    url: "/:id/participacoes/:participacaoId/folha-presenca",
    config: {
      audit: {
        failureAction: "EXPORT",
        module: "ft-edital",
        resourceType: "participacao_pdf",
        resourceIdParam: "participacaoId",
        omitRequestedChanges: true,
      },
    },
    schema: {
      tags: ["PEAAD - Edital"],
      summary: "gerar folha presenca",
      security: [{ JWTToken: [] }],
      params: object({ id: uuid, participacaoId: uuid }),
      querystring: pdfQuery,
      response: {
        200: pdfResponse,
        ...errorResponseSchema,
        409: errorResponseSchema[400],
        410: errorResponseSchema[400],
        422: errorResponseSchema[400],
      },
    },
    preHandler: allow("gerar_folha_presenca"),
    handler: controller.attendanceSheet,
  });
};
