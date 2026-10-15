import { FastifyPluginAsync, FastifyRequest } from "fastify";
import errorResponseSchema from "../../core/schema/errorSchema.js";
import { authorizationFactory } from "../acess-controll/factories/makeAuthorization.js";
import AuthMiddleware from "../auth/auth.middleware.js";
import { TurnoController } from "./turno.controller.js";

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
const common = { tags: ["Frente de Trabalho - Turnos"], security: [{ JWTToken: [] }] };

export const TurnoRouter: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  fastify.addHook("preHandler", async (request: FastifyRequest) => authorizationFactory(request.log).authorize(Number(request.user.id), 6, request.method));
  fastify.get("/", { config: { audit: { failureAction: "LIST", module: "ft-turno", resourceType: "turno" } }, schema: { ...common, querystring: { type: "object", properties: { page: { type: "string", pattern: "^(0|[1-9]\\d*)$" }, limit: { type: "string", pattern: "^([1-9]|[1-9]\\d|100)$" }, search: { type: "string" } } }, response: { 200: { type: "object", properties: { turnos: { type: "array", items: resource }, count: { type: "integer" } } }, ...errorResponseSchema } } }, TurnoController.list);
  fastify.get("/:id", { config: { audit: { failureAction: "VIEW", module: "ft-turno", resourceType: "turno", resourceIdParam: "id" } }, schema: { ...common, params, response: { 200: { type: "object", properties: { turno: resource } }, ...errorResponseSchema } } }, TurnoController.get);
  fastify.post("/", { config: { audit: { failureAction: "CREATE", module: "ft-turno", resourceType: "turno" } }, schema: { ...common, body, response: { 201: { type: "object", properties: { turno: resource } }, ...errorResponseSchema } } }, TurnoController.create);
  fastify.put("/:id", { config: { audit: { failureAction: "UPDATE", module: "ft-turno", resourceType: "turno", resourceIdParam: "id" } }, schema: { ...common, params, body, response: { 200: { type: "object", properties: { turno: resource } }, ...errorResponseSchema } } }, TurnoController.update);
  fastify.delete("/:id", { config: { audit: { failureAction: "DELETE", module: "ft-turno", resourceType: "turno", resourceIdParam: "id" } }, schema: { ...common, params, response: { 204: { type: "null" }, ...errorResponseSchema } } }, TurnoController.delete);
};
