import type { FastifyPluginAsync } from "fastify";
import AuthMiddleware from "../../auth/auth.middleware.js";
import { requirePermission } from "../../acess-controll/interface/require-permission.js";
import { configureBodyValidation } from "../../../infra/http/fastify/body-validation.js";
import type {
  BeneficiosController,
  EditalParams,
  ParticipationParams,
  DeliveryParams,
  DeliveryBody,
  ReverseBody,
} from "./beneficios.controller.js";
import type { BenefitQuery } from "../domain/beneficios.contracts.js";
import {
  uuid,
  object,
  preview,
  delivery,
  history,
  report,
  query,
  deliveryBody,
  reverseBody,
  response,
  metadata,
  viewConfig,
  createConfig,
  reverseConfig,
  exportConfig,
} from "./beneficios.schema.js";
export const BeneficiosRouter: FastifyPluginAsync<{
  controller?: BeneficiosController;
}> = async (app, options) => {
  const controller =
    options.controller ??
    (
      await import("../factories/makeBeneficiosController.js")
    ).makeBeneficiosController();
  app.addHook("preHandler", AuthMiddleware.verifyJWT);
  configureBodyValidation(app, {
    extraField: (field) => "Campo não permitido: " + field,
    invalidType: "Tipo de campo inválido",
  });
  const allow = requirePermission("ft");
  app.route<{ Params: ParticipationParams; Querystring: BenefitQuery }>({
    method: "GET",
    url: "/:id/participacoes/:participacaoId/beneficios",
    config: viewConfig,
    schema: {
      ...metadata,
      summary: "Consultar benefícios mensais da participação",
      params: object({ id: uuid, participacaoId: uuid }),
      querystring: query,
      response: response(preview),
    },
    preHandler: [
      allow("consultar_edital"),
      allow("consultar_vinculos"),
      allow("consultar_entregas_beneficios"),
    ],
    handler: controller.preview,
  });
  app.route<{ Params: ParticipationParams; Body: DeliveryBody }>({
    method: "POST",
    url: "/:id/participacoes/:participacaoId/beneficios/entregas",
    config: createConfig,
    schema: {
      ...metadata,
      summary: "Entregar benefícios do mês atual",
      params: object({ id: uuid, participacaoId: uuid }),
      body: deliveryBody,
      response: response(delivery),
    },
    preHandler: [
      allow("consultar_edital"),
      allow("consultar_vinculos"),
      allow("consultar_entregas_beneficios"),
      allow("entregar_beneficios"),
    ],
    handler: controller.deliver,
  });
  app.route<{ Params: EditalParams; Querystring: BenefitQuery }>({
    method: "GET",
    url: "/:id/beneficios/entregas",
    config: viewConfig,
    schema: {
      ...metadata,
      summary: "Histórico de entregas de benefícios",
      params: object({ id: uuid }),
      querystring: query,
      response: response(history),
    },
    preHandler: [
      allow("consultar_edital"),
      allow("consultar_vinculos"),
      allow("consultar_entregas_beneficios"),
    ],
    handler: controller.history,
  });
  app.route<{ Params: DeliveryParams; Body: ReverseBody }>({
    method: "POST",
    url: "/:id/beneficios/entregas/:entregaId/estornar",
    config: reverseConfig,
    schema: {
      ...metadata,
      summary: "Estornar integralmente entrega de benefícios",
      params: object({ id: uuid, entregaId: uuid }),
      body: reverseBody,
      response: response(delivery),
    },
    preHandler: [
      allow("consultar_edital"),
      allow("consultar_entregas_beneficios"),
      allow("estornar_entrega_beneficios"),
      allow("consultar_vinculos"),
    ],
    handler: controller.reverse,
  });
  app.route<{ Params: EditalParams; Querystring: BenefitQuery }>({
    method: "GET",
    url: "/:id/beneficios/relatorio",
    config: viewConfig,
    schema: {
      ...metadata,
      summary: "Relatório mensal de retiradas e pendências",
      params: object({ id: uuid }),
      querystring: query,
      response: response(report),
    },
    preHandler: [
      allow("consultar_edital"),
      allow("gerar_relatorio_beneficios"),
    ],
    handler: controller.report,
  });
  app.route<{ Params: EditalParams; Querystring: BenefitQuery }>({
    method: "GET",
    url: "/:id/beneficios/relatorio.csv",
    config: exportConfig,
    schema: {
      ...metadata,
      summary: "Exportar relatório mensal de benefícios em CSV",
      params: object({ id: uuid }),
      querystring: query,
      response: response({ type: "string" }),
    },
    preHandler: [
      allow("consultar_edital"),
      allow("gerar_relatorio_beneficios"),
    ],
    handler: controller.csv,
  });
};
