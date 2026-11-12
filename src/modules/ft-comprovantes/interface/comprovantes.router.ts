import type { FastifyPluginAsync } from "fastify";
import AuthMiddleware from "../../auth/auth.middleware.js";
import { requirePermission } from "../../acess-controll/interface/require-permission.js";
import type { ComprovantesController } from "./comprovantes.controller.js";
import errorResponseSchema from "../../../core/schema/errorSchema.js";

const uuid = { type: "string", format: "uuid" };
const response = {
  200: { type: "string", format: "binary" },
  ...errorResponseSchema,
  502: errorResponseSchema[400],
};
export const ComprovantesRouter: FastifyPluginAsync<{
  controller?: ComprovantesController;
}> = async (app, options) => {
  const controller =
    options.controller ??
    (
      await import("../factories/comprovantes.factories.js")
    ).makeComprovantesController();
  app.addHook("preHandler", AuthMiddleware.verifyJWT);
  const allow = requirePermission("ft");
  app.get<{ Params: { id: string } }>(
    "/estoque/entregas/:id/comprovante",
    {
      schema: {
        tags: ["PEAAD - Estoque"],
        security: [{ JWTToken: [] }],
        summary: "Baixar comprovante de entrega de materiais",
        params: { type: "object", required: ["id"], properties: { id: uuid } },
        response,
        produces: ["application/pdf"],
      },
      preHandler: [allow("consultar_entregas_estoque")],
    },
    controller.material,
  );
  app.get<{ Params: { id: string; entregaId: string } }>(
    "/edital/:id/beneficios/entregas/:entregaId/comprovante",
    {
      schema: {
        tags: ["PEAAD - Benefícios"],
        security: [{ JWTToken: [] }],
        summary: "Baixar comprovante de entrega de benefícios",
        params: {
          type: "object",
          required: ["id", "entregaId"],
          properties: { id: uuid, entregaId: uuid },
        },
        response,
        produces: ["application/pdf"],
      },
      preHandler: [
        allow("consultar_edital"),
        allow("consultar_vinculos"),
        allow("consultar_entregas_beneficios"),
      ],
    },
    controller.benefit,
  );
};
