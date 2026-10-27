import { FastifyPluginAsync, FastifyRequest } from "fastify";
import errorResponseSchema from "../../core/schema/errorSchema.js";
import { requirePermission } from "../acess-controll/interface/require-permission.js";
import AuthMiddleware from "../auth/auth.middleware.js";
import type { TurnoController as TurnoControllerType } from "./turno.controller.js";

const resource = { type: "object", additionalProperties: false, properties: {
  uuid: { type: "string", format: "uuid" }, nome: { type: "string" }, hora_inicio: { type: "string" }, hora_fim: { type: "string" },
  createdAt: { type: "string" }, updatedAt: { type: "string" }, deletedAt: { anyOf: [{ type: "string" }, { type: "null" }] },
} };
const params = { type: "object", required: ["id"], properties: { id: { type: "string", format: "uuid" } } };
const body = { type: "object", additionalProperties: false, required: ["turno"], properties: { turno: {
  type: "object", additionalProperties: false, required: ["nome", "hora_inicio", "hora_fim"], properties: {
    nome: { type: "string", minLength: 1, maxLength: 120, pattern: "\\S" }, hora_inicio: { type: "string" }, hora_fim: { type: "string" },
  },
} } };
const common = { tags: ["PEAAD - Turnos"], security: [{ JWTToken: [] }] };

export const TurnoRouter: FastifyPluginAsync<{controller?: typeof TurnoControllerType}> = async (fastify, options) => {
  const TurnoController = options.controller ?? (await import("./turno.controller.js")).TurnoController;
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  const allow = requirePermission("ft");
  fastify.get("/", { preHandler: allow("consultar_turno"), config: { audit: { failureAction: "LIST", module: "ft-turno", resourceType: "turno" } }, schema: { ...common, querystring: { type: "object", properties: { page: { type: "string", pattern: "^(0|[1-9]\\d*)$" }, limit: { type: "string", pattern: "^([1-9]|[1-9]\\d|100)$" }, search: { type: "string" } } }, response: { 200: { type: "object", properties: { turnos: { type: "array", items: resource }, count: { type: "integer" } } }, ...errorResponseSchema } } }, TurnoController.list);
  fastify.get("/:id", { preHandler: allow("consultar_turno"), config: { audit: { failureAction: "VIEW", module: "ft-turno", resourceType: "turno", resourceIdParam: "id" } }, schema: { ...common, params, response: { 200: { type: "object", properties: { turno: resource } }, ...errorResponseSchema } } }, TurnoController.get);
  fastify.post("/", { preHandler: allow("cadastrar_turno"), config: { audit: { failureAction: "CREATE", module: "ft-turno", resourceType: "turno" } }, schema: { ...common, body, response: { 201: { type: "object", properties: { turno: resource } }, ...errorResponseSchema } } }, TurnoController.create);
  fastify.put("/:id", { preHandler: allow("editar_turno"), config: { audit: { failureAction: "UPDATE", module: "ft-turno", resourceType: "turno", resourceIdParam: "id" } }, schema: { ...common, params, body, response: { 200: { type: "object", properties: { turno: resource } }, ...errorResponseSchema } } }, TurnoController.update);
  fastify.delete("/:id", { preHandler: allow("excluir_turno"), config: { audit: { failureAction: "DELETE", module: "ft-turno", resourceType: "turno", resourceIdParam: "id" } }, schema: { ...common, params, response: { 204: { type: "null" }, ...errorResponseSchema } } }, TurnoController.delete);
};
