import { FastifyPluginAsync, FastifyRequest } from "fastify";
import AuthMiddleware from "../../auth/auth.middleware.js";
import { requirePermission } from "../../acess-controll/interface/require-permission.js";
import type { AuditController as AuditControllerType } from "./audit.controller.js";
import { AuditQueryDto } from "../application/dto/audit.dto.js";

export const AUDIT_SERVICE_ID = 11;

export const AuditRoutes: FastifyPluginAsync<{controller?: typeof AuditControllerType}> = async (fastify, options) => {
  const AuditController = options.controller ?? (await import("./audit.controller.js")).AuditController;
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  const allow = requirePermission("auditoria");
  fastify.get<{ Querystring: AuditQueryDto }>(
    "/",
    {
      config: { audit: { failureAction: "LIST", module: "audit", resourceType: "audit" } },
      preHandler: allow("consultar_auditoria"),
    },
    AuditController.list,
  );
  fastify.get<{ Params: { id: string } }>(
    "/:id",
    {
      config: { audit: { failureAction: "VIEW", module: "audit", resourceType: "audit", resourceIdParam: "id" } },
      preHandler: allow("consultar_auditoria"),
    },
    AuditController.detail,
  );
  fastify.post<{ Body: AuditQueryDto }>(
    "/export",
    {
      config: { audit: { failureAction: "EXPORT", module: "audit", resourceType: "audit" } },
      preHandler: allow("exportar_auditoria"),
    },
    AuditController.export,
  );
};
