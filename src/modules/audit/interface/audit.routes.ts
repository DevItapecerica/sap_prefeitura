import { FastifyPluginAsync, FastifyRequest } from "fastify";
import AuthMiddleware from "../../auth/auth.middleware.js";
import { authorizationFactory } from "../../acess-controll/factory/makeAuthorization.js";
import { AuditController } from "./audit.controller.js";
import { AuditQueryDto } from "../application/dto/audit.dto.js";

export const AUDIT_SERVICE_ID = 11;

export const AuditRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  fastify.get<{ Querystring: AuditQueryDto }>("/", { preHandler: async (request: FastifyRequest) => authorizationFactory(request.log).authorize(Number(request.user.id), AUDIT_SERVICE_ID, "GET") }, AuditController.list);
  fastify.get<{ Params: { id: string } }>("/:id", { preHandler: async (request: FastifyRequest) => authorizationFactory(request.log).authorize(Number(request.user.id), AUDIT_SERVICE_ID, "GET") }, AuditController.detail);
  fastify.post<{ Body: AuditQueryDto }>("/export", { preHandler: async (request: FastifyRequest) => authorizationFactory(request.log).authorize(Number(request.user.id), AUDIT_SERVICE_ID, "POST") }, AuditController.export);
};
