import {
  workflowViewConfig,
  workflowCreateConfig,
  workflowUpdateConfig,
  workflowPdfConfig,
  workflowMetadata,
  workflowItemResponse,
  workflowCollectionResponse,
  workflowPdfResponse,
} from "../schema/edital-workflow.http.js";
import type { FastifyPluginAsync } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { requirePermission } from "../../../acess-controll/interface/require-permission.js";
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

  fastify.route<{
    Params: Record<string, never>;
    Querystring: WorkflowQuery;
    Body: never;
  }>({
    method: "GET",
    url: "/",
    config: workflowViewConfig,
    schema: {
      ...workflowMetadata,
      summary: "consultar edital",
      querystring: query,
      response: workflowCollectionResponse,
    },
    preHandler: allow("consultar_edital"),
    handler: controller.list,
  });

  fastify.route<{
    Params: Record<string, never>;
    Querystring: WorkflowQuery;
    Body: EditalInput;
  }>({
    method: "POST",
    url: "/",
    config: workflowCreateConfig,
    schema: {
      ...workflowMetadata,
      summary: "cadastrar edital",
      body: editalBody,
      response: workflowItemResponse,
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
    config: workflowViewConfig,
    schema: {
      ...workflowMetadata,
      summary: "consultar edital",
      params: object({ id: uuid }),
      querystring: query,
      response: workflowItemResponse,
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
    config: workflowUpdateConfig,
    schema: {
      ...workflowMetadata,
      summary: "editar edital",
      params: object({ id: uuid }),
      body: editalBody,
      response: workflowItemResponse,
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
    config: workflowUpdateConfig,
    schema: {
      ...workflowMetadata,
      summary: "alterar janela inscricoes",
      params: object({ id: uuid }),
      body: windowBody,
      response: workflowItemResponse,
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
    config: workflowCreateConfig,
    schema: {
      ...workflowMetadata,
      summary: "editar edital",
      params: object({ id: uuid }),
      response: workflowItemResponse,
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
    config: workflowCreateConfig,
    schema: {
      ...workflowMetadata,
      summary: "encerrar edital",
      params: object({ id: uuid }),
      response: workflowItemResponse,
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
    config: workflowViewConfig,
    schema: {
      ...workflowMetadata,
      summary: "consultar pagador",
      params: object({ id: uuid }),
      querystring: query,
      response: workflowCollectionResponse,
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
    config: workflowCreateConfig,
    schema: {
      ...workflowMetadata,
      summary: "cadastrar pagador",
      params: object({ id: uuid }),
      body: payerBody,
      response: workflowItemResponse,
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
    config: workflowUpdateConfig,
    schema: {
      ...workflowMetadata,
      summary: "editar pagador",
      params: object({ id: uuid, itemId: uuid }),
      body: payerBody,
      response: workflowItemResponse,
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
    config: workflowUpdateConfig,
    schema: {
      ...workflowMetadata,
      summary: "excluir pagador",
      params: object({ id: uuid, itemId: uuid }),
      response: workflowItemResponse,
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
    config: workflowViewConfig,
    schema: {
      ...workflowMetadata,
      summary: "consultar turno",
      params: object({ id: uuid }),
      querystring: query,
      response: workflowCollectionResponse,
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
    config: workflowCreateConfig,
    schema: {
      ...workflowMetadata,
      summary: "cadastrar turno",
      params: object({ id: uuid }),
      body: shiftBody,
      response: workflowItemResponse,
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
    config: workflowUpdateConfig,
    schema: {
      ...workflowMetadata,
      summary: "editar turno",
      params: object({ id: uuid, itemId: uuid }),
      body: shiftBody,
      response: workflowItemResponse,
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
    config: workflowUpdateConfig,
    schema: {
      ...workflowMetadata,
      summary: "excluir turno",
      params: object({ id: uuid, itemId: uuid }),
      response: workflowItemResponse,
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
    config: workflowViewConfig,
    schema: {
      ...workflowMetadata,
      summary: "consultar configuracao edital",
      params: object({ id: uuid }),
      querystring: query,
      response: workflowCollectionResponse,
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
    config: workflowCreateConfig,
    schema: {
      ...workflowMetadata,
      summary: "editar configuracao edital",
      params: object({ id: uuid }),
      body: configBody,
      response: workflowItemResponse,
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
    config: workflowUpdateConfig,
    schema: {
      ...workflowMetadata,
      summary: "editar configuracao edital",
      params: object({ id: uuid, itemId: uuid }),
      body: configBody,
      response: workflowItemResponse,
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
    config: workflowUpdateConfig,
    schema: {
      ...workflowMetadata,
      summary: "editar configuracao edital",
      params: object({ id: uuid, itemId: uuid }),
      response: workflowItemResponse,
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
    config: workflowViewConfig,
    schema: {
      ...workflowMetadata,
      summary: "consultar configuracao edital",
      params: object({ id: uuid }),
      querystring: query,
      response: workflowCollectionResponse,
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
    config: workflowCreateConfig,
    schema: {
      ...workflowMetadata,
      summary: "editar configuracao edital",
      params: object({ id: uuid }),
      body: configBody,
      response: workflowItemResponse,
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
    config: workflowUpdateConfig,
    schema: {
      ...workflowMetadata,
      summary: "editar configuracao edital",
      params: object({ id: uuid, itemId: uuid }),
      body: configBody,
      response: workflowItemResponse,
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
    config: workflowUpdateConfig,
    schema: {
      ...workflowMetadata,
      summary: "editar configuracao edital",
      params: object({ id: uuid, itemId: uuid }),
      response: workflowItemResponse,
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
    config: workflowViewConfig,
    schema: {
      ...workflowMetadata,
      summary: "consultar inscricoes",
      params: object({ id: uuid }),
      querystring: query,
      response: workflowCollectionResponse,
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
    config: workflowViewConfig,
    schema: {
      ...workflowMetadata,
      summary: "consultar inscricoes",
      params: object({ id: uuid, inscricaoId: uuid }),
      querystring: query,
      response: workflowCollectionResponse,
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
    config: workflowViewConfig,
    schema: {
      ...workflowMetadata,
      summary: "consultar vinculos",
      params: object({ id: uuid, participacaoId: uuid }),
      querystring: query,
      response: workflowCollectionResponse,
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
    config: workflowViewConfig,
    schema: {
      ...workflowMetadata,
      summary: "cadastrar inscricao",
      params: object({ id: uuid }),
      body: prevalidationBody,
      response: workflowItemResponse,
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
    config: workflowViewConfig,
    schema: {
      ...workflowMetadata,
      summary: "encaixar inscricao",
      params: object({ id: uuid }),
      body: prevalidationBody,
      response: workflowItemResponse,
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
    config: workflowViewConfig,
    schema: {
      ...workflowMetadata,
      summary: "cadastrar inscricao excecao",
      params: object({ id: uuid }),
      body: prevalidationBody,
      response: workflowItemResponse,
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
    config: workflowViewConfig,
    schema: {
      ...workflowMetadata,
      summary: "convocar inscrito",
      params: object({ id: uuid }),
      body: prevalidationBody,
      response: workflowItemResponse,
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
    config: workflowViewConfig,
    schema: {
      ...workflowMetadata,
      summary: "convocar inscrito excecao",
      params: object({ id: uuid }),
      body: prevalidationBody,
      response: workflowItemResponse,
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
    config: workflowViewConfig,
    schema: {
      ...workflowMetadata,
      summary: "ativar participacao",
      params: object({ id: uuid }),
      body: prevalidationBody,
      response: workflowItemResponse,
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
    config: workflowViewConfig,
    schema: {
      ...workflowMetadata,
      summary: "prorrogar vinculo",
      params: object({ id: uuid }),
      body: prevalidationBody,
      response: workflowItemResponse,
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
    config: workflowCreateConfig,
    schema: {
      ...workflowMetadata,
      summary: "cadastrar inscricao",
      params: object({ id: uuid }),
      body: registrationBody,
      response: workflowItemResponse,
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
    config: workflowCreateConfig,
    schema: {
      ...workflowMetadata,
      summary: "encaixar inscricao",
      params: object({ id: uuid }),
      body: exceptionBody,
      response: workflowItemResponse,
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
    config: workflowCreateConfig,
    schema: {
      ...workflowMetadata,
      summary: "cadastrar inscricao excecao",
      params: object({ id: uuid }),
      body: exceptionBody,
      response: workflowItemResponse,
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
    config: workflowCreateConfig,
    schema: {
      ...workflowMetadata,
      summary: "convocar inscrito",
      params: object({ id: uuid, inscricaoId: uuid }),
      body: callBody,
      response: workflowItemResponse,
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
    config: workflowCreateConfig,
    schema: {
      ...workflowMetadata,
      summary: "convocar inscrito excecao",
      params: object({ id: uuid, inscricaoId: uuid }),
      body: callExceptionBody,
      response: workflowItemResponse,
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
    config: workflowViewConfig,
    schema: {
      ...workflowMetadata,
      summary: "consultar vinculos",
      params: object({ id: uuid }),
      querystring: query,
      response: workflowCollectionResponse,
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
    config: workflowCreateConfig,
    schema: {
      ...workflowMetadata,
      summary: "ativar participacao",
      params: object({ id: uuid, participacaoId: uuid }),
      body: activationBody,
      response: workflowItemResponse,
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
    config: workflowCreateConfig,
    schema: {
      ...workflowMetadata,
      summary: "cancelar participacao",
      params: object({ id: uuid, participacaoId: uuid }),
      body: reasonBody,
      response: workflowItemResponse,
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
    config: workflowCreateConfig,
    schema: {
      ...workflowMetadata,
      summary: "cancelar participacao",
      params: object({ id: uuid, participacaoId: uuid }),
      body: reasonBody,
      response: workflowItemResponse,
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
    config: workflowCreateConfig,
    schema: {
      ...workflowMetadata,
      summary: "prorrogar vinculo",
      params: object({ id: uuid, participacaoId: uuid }),
      body: emptyBody,
      response: workflowItemResponse,
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
    config: workflowCreateConfig,
    schema: {
      ...workflowMetadata,
      summary: "editar vinculo",
      params: object({ id: uuid, participacaoId: uuid }),
      body: allocationBody,
      response: workflowItemResponse,
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
    config: workflowViewConfig,
    schema: {
      ...workflowMetadata,
      summary: "consultar faltas",
      params: object({ id: uuid, participacaoId: uuid }),
      querystring: query,
      response: workflowCollectionResponse,
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
    config: workflowCreateConfig,
    schema: {
      ...workflowMetadata,
      summary: "registrar falta",
      params: object({ id: uuid, participacaoId: uuid }),
      body: absenceBody,
      response: workflowItemResponse,
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
    config: workflowUpdateConfig,
    schema: {
      ...workflowMetadata,
      summary: "excluir falta",
      params: object({ id: uuid, participacaoId: uuid, itemId: uuid }),
      response: workflowItemResponse,
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
    config: workflowViewConfig,
    schema: {
      ...workflowMetadata,
      summary: "consultar ocorrencias",
      params: object({ id: uuid, participacaoId: uuid }),
      querystring: query,
      response: workflowCollectionResponse,
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
    config: workflowCreateConfig,
    schema: {
      ...workflowMetadata,
      summary: "registrar ocorrencia",
      params: object({ id: uuid, participacaoId: uuid }),
      body: occurrenceBody,
      response: workflowItemResponse,
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
    config: workflowUpdateConfig,
    schema: {
      ...workflowMetadata,
      summary: "excluir ocorrencia",
      params: object({ id: uuid, participacaoId: uuid, itemId: uuid }),
      response: workflowItemResponse,
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
    config: workflowPdfConfig,
    schema: {
      ...workflowMetadata,
      summary: "gerar espelho ponto",
      params: object({ id: uuid, participacaoId: uuid }),
      querystring: pdfQuery,
      response: workflowPdfResponse,
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
    config: workflowPdfConfig,
    schema: {
      ...workflowMetadata,
      summary: "gerar folha presenca",
      params: object({ id: uuid, participacaoId: uuid }),
      querystring: pdfQuery,
      response: workflowPdfResponse,
    },
    preHandler: allow("gerar_folha_presenca"),
    handler: controller.attendanceSheet,
  });
};
