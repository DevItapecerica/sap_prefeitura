import {catalogResponse, roleGrantsResponse, effectiveResponse, grantUpdateResponse} from "../schemas/action-permissions.schema.js";
import type { FastifyPluginAsync } from "fastify";
import AuthMiddleware from "../../../auth/auth.middleware.js";
import { requirePermission } from "../../../acess-controll/interface/require-permission.js";
import { ActionPermissionRuntime, parseGrantBody, parsePermissionQuery, positiveId, rejectOwnQuery } from "../../application/use-case/action-permissions.js";
import { EventBusAdapter } from "../../../../infra/event/event-bus.adapter.js";
import { PermissionEventMap, PERMISSION_EVENTS } from "../../application/events/permission.events.js";
import { makeApplicationEventContext } from "../../../../infra/http/fastify/application-event-context.js";

const common = {tags: ["Permissions"], security: [{JWTToken: []}]};
const pageProperties = {service_id: {type: "integer", minimum: 1}, page: {type: "integer", minimum: 0}, limit: {type: "integer", minimum: 1, maximum: 100}};
const grantBody = {type: "object", additionalProperties: false, required: ["permissions"], properties: {permissions: {type: "array", minItems: 1, maxItems: 100, items: {type: "object", additionalProperties: false, required: ["permission_action_id", "allowed"], properties: {permission_action_id: {type: "integer", minimum: 1}, allowed: {type: "boolean"}}}}}};
const permissionRouter: FastifyPluginAsync<{runtime?: ActionPermissionRuntime}> = async (fastify, options) => {
  fastify.addHook("preHandler", AuthMiddleware.verifyJWT);
  const allow = requirePermission("servicos");
  const runtime = async (): Promise<ActionPermissionRuntime> => options.runtime ?? new (await import("../../../../infra/database/sequelize/repositories/sequelize.action-permission.repository.js")).SequelizeActionPermissionRepository();
  fastify.get("/catalog", {
    preHandler: allow("consultar_permissoes"), config: {audit: {failureAction: "LIST", module: "permission", resourceType: "role_permission"}},
    preValidation: async request => {parsePermissionQuery(request.query);},
    schema: {...common, response: catalogResponse, querystring: {type: "object", additionalProperties: false, properties: pageProperties}},
  }, async (request) => ({...await (await runtime()).catalog(parsePermissionQuery(request.query)), ok: true}));
  fastify.get("/me", {
    config: {audit: {failureAction: "LIST", module: "permission", resourceType: "role_permission"}}, preValidation: async request => {rejectOwnQuery(request.query);},
    schema: {...common, response: effectiveResponse, querystring: {type: "object", additionalProperties: false, properties: {}}},
  }, async request => ({permissions: await (await runtime()).effective(Number(request.user.id)), ok: true}));
  fastify.get("/", {
    preHandler: allow("consultar_permissoes"), config: {audit: {failureAction: "LIST", module: "permission", resourceType: "role_permission"}},
    preValidation: async request => {parsePermissionQuery(request.query, true);},
    schema: {...common, response: roleGrantsResponse, querystring: {type: "object", additionalProperties: false, required: ["role_id"], properties: {...pageProperties, role_id: {type: "integer", minimum: 1}}}},
  }, async request => ({...await (await runtime()).list(parsePermissionQuery(request.query, true)), ok: true}));
  fastify.put<{Params: {roleId: number}}>("/role/:roleId", {
    preHandler: allow("gerenciar_permissoes"), config: {audit: {failureAction: "UPDATE", module: "permission", resourceType: "role_permission", resourceIdParam: "roleId"}},
    preValidation: async request => {positiveId(request.params.roleId); parseGrantBody(request.body);},
    schema: {...common, params: {type: "object", additionalProperties: false, required: ["roleId"], properties: {roleId: {type: "integer", minimum: 1}}}, body: grantBody, response: grantUpdateResponse},
  }, async (request, reply) => {
    const roleId = positiveId(request.params.roleId);
    const result = await (await runtime()).update(Number(request.user.id), roleId, parseGrantBody(request.body));
    if (result.changes.length) {
      await new EventBusAdapter<PermissionEventMap>().publish(PERMISSION_EVENTS.updated, {
        context: makeApplicationEventContext(request),
        before: {id: roleId, role_id: roleId, permissions: result.changes.map(c => ({permission_action_id: c.permission_action_id, allowed: c.before}))},
        after: {id: roleId, role_id: roleId, permissions: result.changes.map(c => ({permission_action_id: c.permission_action_id, allowed: c.after}))},
      });
    }
    return reply.status(204).send();
  });
};
export default permissionRouter;
