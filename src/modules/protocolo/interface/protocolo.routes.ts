import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import multipart from "@fastify/multipart";
import AuthMiddleware from "../../auth/auth.middleware.js";
import AppError from "../../../core/appError.js";
import { ProtocolService } from "../application/protocol.service.js";
import { ProtocolStorage } from "../infra/protocol.storage.js";
import { authorizationFactory } from "../../acess-controll/factories/makeAuthorization.js";
import { makeAuditService } from "../../audit/factories/makeAuditService.js";
import { makeApplicationEventContext } from "../../../infra/http/fastify/application-event-context.js";
import {
  attachmentQuerySchema,
  citizenBodySchema,
  fieldSchema,
  internalProtocolDetailResponseSchema,
  internalListQuerySchema,
  internalProtocolBodySchema,
  okResponseSchema,
  protocolAttachmentResponseSchema,
  protocolCapabilitiesResponseSchema,
  protocolAttachmentParamsSchema,
  protocolBodySchema,
  protocolCapabilitiesBodySchema,
  protocolErrorResponses,
  protocolFormResponseSchema,
  protocolParamsSchema,
  protocolRequirementParamsSchema,
  protocolRequirementResponseSchema,
  protocolResponseSchema,
  protocolTypes,
  protocolRolePermissionResponseSchema,
  protocolServiceDraftResponseSchema,
  protocolServiceResponseSchema,
  publicProtocolDetailResponseSchema,
  privacyNoticeResponseSchema,
  protocolOperationsResponseSchema,
  protocolReadinessResponseSchema,
  internalPrivacyRequestResponseSchema,
  publicPrivacyRequestResponseSchema,
  privacyRequestBodySchema,
  privacyRequestParamsSchema,
  privacyRequestStatuses,
  privacyRequestUpdateSchema,
  retentionPreviewResponseSchema,
  requirementBodySchema,
  roleParamsSchema,
  serviceFormParamsSchema,
  serviceParamsSchema,
  transitionBodySchema,
  successResponse,
} from "./protocol.schemas.js";
import { assertInternalProtocolAccess, InternalProtocolOperation, requiresRestrictedCapability } from "../domain/protocol-access.js";
import { ProtocolPermissionService } from "../application/protocol-permission.service.js";
import { ProtocolCapability } from "../domain/protocol-capability.js";
import { ProtocolPrivacyService } from "../application/protocol-privacy.service.js";
import { ProtocolOperationsService } from "../application/protocol-operations.service.js";
import { ProtocolReadinessService } from "../application/protocol-readiness.service.js";
import type { AuditableAction } from "../../../core/event/auditable-action.js";
import { protocolModels } from "../infra/protocol-model-registry.js";
import type { ProtocolCapabilities } from "../domain/protocol-capability.js";
import type {
  InternalProtocolOpeningInput,
  ProtocolCitizenInput,
  ProtocolDecisionInput,
  ProtocolForwardInput,
  ProtocolFormInput,
  ProtocolLegalHoldInput,
  ProtocolListQuery,
  ProtocolMessageInput,
  ProtocolOpeningInput,
  ProtocolPrivacyListQuery,
  ProtocolPrivacyUpdateInput,
  ProtocolRequirementInput,
  ProtocolServiceDraftInput,
  ProtocolServiceInput,
} from "../application/protocol.dto.js";

const service = new ProtocolService(); const storage = new ProtocolStorage();
const auditService = makeAuditService();
const permissionService = new ProtocolPermissionService();
const privacyService = new ProtocolPrivacyService();
const operationsService = new ProtocolOperationsService();
const readinessService = new ProtocolReadinessService();
const bearer = (r: FastifyRequest) => r.headers.authorization;
const publicSession = (r: FastifyRequest) => service.verifyCitizenToken(bearer(r));
const audit = (action: AuditableAction, resourceIdParam?: string) => ({ audit: { failureAction: action, module: "protocolo", resourceType: "protocolo", resourceIdParam } });
const citizenSecurity = [{ JWTToken: [] }];
const responses = (status: number, schema: Record<string, unknown>) => ({ [status]: schema, ...protocolErrorResponses });
const binaryResponseSchema = { type: "string", format: "binary" };
const accessVerificationResponseSchema = {
  type: "object", additionalProperties: false, required: ["ok", "token", "citizenExists"],
  properties: { ok: { type: "boolean", const: true }, token: { type: "string" }, citizenExists: { type: "boolean" } },
};
const citizenCreatedResponseSchema = {
  type: "object", additionalProperties: false, required: ["ok", "citizenId", "token"],
  properties: { ok: { type: "boolean", const: true }, citizenId: { type: "string", format: "uuid" }, token: { type: "string" } },
};
const requireCapability = (capability: ProtocolCapability) => async (request: FastifyRequest) => permissionService.authorize(Number(request.user.role_id), capability);
const requireProtocolAdmin = async (request: FastifyRequest) => {
  if (Number(request.user.role_id) !== 1) throw new AppError("Administracao de permissoes restrita ao administrador", 403, "PROTOCOL_PERMISSION_ADMIN_DENIED");
};

const routes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(multipart, { limits: { files: 1, fileSize: 10 * 1024 * 1024 } });
  fastify.addHook("onResponse", async (request, reply) => {
    const metadata = request.routeOptions.config.audit; if (!metadata || reply.statusCode >= 400) return; const context = makeApplicationEventContext(request); const params = request.params as Record<string, string>;
    try { await auditService.record({ actor: { userId: context.actor?.id ?? null, name: context.actor?.name ?? null, roleId: context.actor?.roleId ?? null, setorId: context.actor?.setorId ?? null }, module: metadata.module, resourceType: metadata.resourceType, resourceId: metadata.resourceIdParam ? params?.[metadata.resourceIdParam] ?? null : null, action: metadata.failureAction, result: "SUCCESS", requestId: context.correlationId, ip: context.origin?.ip ?? null, method: context.origin?.method ?? null, route: context.origin?.route ?? null, metadata: { statusCode: reply.statusCode } }); }
    catch (error) { request.log.error({ err: error }, "Falha ao registrar auditoria de protocolo"); }
  });

  fastify.get("/health/antivirus", {
    config: { auditExempt: true },
    schema: {
      response: responses(200, {
        type: "object",
        additionalProperties: false,
        required: ["ok", "service"],
        properties: { ok: { type: "boolean", const: true }, service: { type: "string", const: "clamav" } },
      }),
    },
  }, async () => {
    await storage.assertAntivirusReady();
    return { ok: true, service: "clamav" };
  });

  fastify.get("/health/readiness", {
    config: { auditExempt: true },
    schema: {
      response: {
        200: protocolReadinessResponseSchema,
        503: protocolReadinessResponseSchema,
      },
    },
  }, async (_request, reply) => {
    const snapshot = await readinessService.check();
    return reply.code(snapshot.ready ? 200 : 503).send(snapshot);
  });

  fastify.get("/public/services", { config: audit("LIST"), schema: { response: responses(200, successResponse({ type: "array", items: protocolServiceResponseSchema })) } }, async () => ({ data: await service.listServices(), ok: true }));
  fastify.get("/public/privacy-notice", { config: audit("VIEW"), schema: { response: responses(200, successResponse(privacyNoticeResponseSchema)) } }, async () => ({ data: privacyService.notice(), ok: true }));
  fastify.post("/public/access/request", { config: audit("CREATE"), schema: { body: { type: "object", additionalProperties: false, required: ["cpf", "email"], properties: { cpf: { type: "string", minLength: 11, maxLength: 20 }, email: { type: "string", format: "email", maxLength: 254 } } }, response: responses(202, okResponseSchema) } }, async (r: FastifyRequest<{ Body: { cpf: string; email: string } }>, reply) => { await service.requestCode(r.body.cpf, r.body.email, r.ip); return reply.code(202).send({ ok: true }); });
  fastify.post("/public/access/verify", { config: audit("VIEW"), schema: { body: { type: "object", additionalProperties: false, required: ["cpf", "email", "code"], properties: { cpf: { type: "string", minLength: 11, maxLength: 20 }, email: { type: "string", format: "email", maxLength: 254 }, code: { type: "string", pattern: "^[0-9]{6}$" } } }, response: responses(200, accessVerificationResponseSchema) } }, async (r: FastifyRequest<{ Body: { cpf: string; email: string; code: string } }>) => ({ ...(await service.verifyCode(r.body.cpf, r.body.email, r.body.code)), ok: true }));
  fastify.post("/public/citizens", { config: audit("CREATE"), schema: { security: citizenSecurity, body: citizenBodySchema, response: responses(201, citizenCreatedResponseSchema) } }, async (r: FastifyRequest<{ Body: ProtocolCitizenInput }>, reply) => { const session = publicSession(r); const citizenId = await service.registerCitizen(session, r.body); return reply.code(201).send({ citizenId, token: service.issueCitizenToken(session, citizenId), ok: true }); });
  fastify.post("/public/protocols", { config: audit("CREATE"), schema: { security: citizenSecurity, body: protocolBodySchema, response: responses(201, successResponse(protocolResponseSchema)) } }, async (r: FastifyRequest<{ Body: ProtocolOpeningInput }>, reply) => reply.code(201).send({ data: await service.createProtocol(publicSession(r), r.body), ok: true }));
  fastify.get("/public/protocols", { config: audit("LIST"), schema: { security: citizenSecurity, response: responses(200, successResponse({ type: "array", items: protocolResponseSchema })) } }, async (r) => ({ data: await service.listCitizen(publicSession(r)), ok: true }));
  fastify.get("/public/protocols/:id", { config: audit("VIEW", "id"), schema: { security: citizenSecurity, params: protocolParamsSchema, response: responses(200, successResponse(publicProtocolDetailResponseSchema)) } }, async (r: FastifyRequest<{ Params: { id: string } }>) => ({ data: await service.getCitizenProtocol(publicSession(r), r.params.id), ok: true }));
  fastify.get("/public/protocols/:id/receipt", { config: audit("EXPORT", "id"), schema: { security: citizenSecurity, params: protocolParamsSchema, response: responses(200, binaryResponseSchema) } }, async (r: FastifyRequest<{ Params: { id: string } }>, reply) => reply.header("Content-Type", "application/pdf").header("Content-Disposition", "attachment; filename=protocolo.pdf").header("Cache-Control", "private, no-store").header("X-Content-Type-Options", "nosniff").send(await service.receipt(publicSession(r), r.params.id)));
  fastify.post("/public/protocols/:id/cancel", { config: audit("UPDATE", "id"), schema: { security: citizenSecurity, params: protocolParamsSchema, response: responses(200, successResponse(protocolResponseSchema)) } }, async (r: FastifyRequest<{ Params: { id: string } }>) => ({ data: await service.cancel(publicSession(r), r.params.id), ok: true }));
  fastify.post("/public/protocols/:id/requirements/:requirementId/answer", { config: audit("UPDATE", "id"), schema: { security: citizenSecurity, params: protocolRequirementParamsSchema, body: { type: "object", additionalProperties: false, required: ["response"], properties: { response: { type: "string", minLength: 1, maxLength: 4000 } } }, response: responses(200, successResponse(protocolRequirementResponseSchema)) } }, async (r: FastifyRequest<{ Params: { id: string; requirementId: string }; Body: { response: string } }>) => ({ data: await service.answerRequirement(publicSession(r), r.params.id, r.params.requirementId, r.body.response), ok: true }));
  fastify.post("/public/protocols/:id/attachments", { config: audit("CREATE", "id"), schema: { security: citizenSecurity, params: protocolParamsSchema, querystring: attachmentQuerySchema, response: responses(201, successResponse(protocolAttachmentResponseSchema)) } }, async (r: FastifyRequest<{ Params: { id: string }; Querystring: { requirementId?: string } }>, reply) => upload(r, reply, "CITIZEN"));
  fastify.get("/public/protocols/:id/attachments/:attachmentId", { config: audit("VIEW", "id"), schema: { security: citizenSecurity, params: protocolAttachmentParamsSchema, response: responses(200, binaryResponseSchema) } }, async (r: FastifyRequest<{ Params: { id: string; attachmentId: string } }>, reply) => download(r, reply, true));
  fastify.post("/public/privacy-requests", { config: audit("CREATE"), schema: { security: citizenSecurity, body: privacyRequestBodySchema, response: responses(201, successResponse(publicPrivacyRequestResponseSchema)) } }, async (r: FastifyRequest<{ Body: { requestType: string; details: string; protocolId?: string } }>, reply) => reply.code(201).send({ data: await privacyService.createRequest(publicSession(r), r.body), ok: true }));
  fastify.get("/public/privacy-requests", { config: audit("LIST"), schema: { security: citizenSecurity, response: responses(200, successResponse({ type: "array", items: publicPrivacyRequestResponseSchema })) } }, async (r) => ({ data: await privacyService.listCitizen(publicSession(r)), ok: true }));

  fastify.register(async (internal) => {
    internal.addHook("onRoute", (routeOptions) => {
      routeOptions.schema = { ...routeOptions.schema, security: [{ JWTToken: [] }] };
    });
    internal.addHook("preHandler", AuthMiddleware.verifyJWT);
    internal.addHook("preHandler", async (request) => authorizationFactory(request.log).authorize(Number(request.user.id), 12, request.method));
    internal.addHook("preHandler", async (request) => {
      const url = request.routeOptions.url; if (!url?.startsWith("/protocols/")) return; const id = (request.params as { id?: string })?.id; if (!id) return;
      let operation: InternalProtocolOperation = request.method === "GET" ? "VIEW" : "MUTATE";
      if (url.endsWith("/assume")) operation = "ASSUME";
      else if (url.endsWith("/forward")) operation = "FORWARD";
      else if (url.endsWith("/legal-hold")) operation = "PRIVACY";
      const protocol = await protocolModels().ProtocolModel.findByPk(id, { attributes: ["currentSectorId", "assigneeId", "state", "confidentiality"] });
      if (!protocol) throw new AppError("Protocolo nao encontrado", 404, "PROTOCOL_NOT_FOUND");
      if (requiresRestrictedCapability(protocol.confidentiality, operation)) await permissionService.authorize(Number(request.user.role_id), "viewRestricted");
      assertInternalProtocolAccess(protocol, request.user, operation);
    });
    internal.get<{ Querystring: ProtocolListQuery }>("/protocols", { config: audit("LIST"), preHandler: requireCapability("viewSector"), schema: { querystring: internalListQuerySchema, response: responses(200, successResponse({ type: "array", items: protocolResponseSchema })) } }, async (r) => { const capabilities = await permissionService.getForRole(Number(r.user.role_id)); return { data: await service.listInternal(r.query, r.user, capabilities.viewRestricted), ok: true }; });
    internal.get<{ Querystring: ProtocolListQuery }>("/protocols-export", { config: audit("EXPORT"), preHandler: requireCapability("export"), schema: { querystring: internalListQuerySchema, response: responses(200, { type: "string" }) } }, async (r, reply) => { const capabilities = await permissionService.getForRole(Number(r.user.role_id)); return reply.header("Content-Type", "text/csv; charset=utf-8").header("Content-Disposition", "attachment; filename=protocolos.csv").header("Cache-Control", "private, no-store").send(`\uFEFF${await service.exportInternal(r.query, r.user, capabilities.viewRestricted)}`); });
    internal.get<{ Params: { id: string } }>("/protocols/:id", { config: audit("VIEW", "id"), preHandler: requireCapability("viewSector"), schema: { params: protocolParamsSchema, response: responses(200, successResponse(internalProtocolDetailResponseSchema)) } }, async (r) => ({ data: await service.getInternal(r.params.id), ok: true }));
    internal.post<{ Body: InternalProtocolOpeningInput }>("/protocols", { config: audit("CREATE"), preHandler: requireCapability("triage"), schema: { body: internalProtocolBodySchema, response: responses(201, successResponse(protocolResponseSchema)) } }, async (r, reply) => reply.code(201).send({ data: await service.createProtocolForCitizen(r.body, Number(r.user.id)), ok: true }));
    internal.post<{ Params: { id: string }; Body: ProtocolDecisionInput }>("/protocols/:id/transition", { config: audit("UPDATE", "id"), preHandler: requireCapability("decide"), schema: { params: protocolParamsSchema, body: transitionBodySchema, response: responses(200, successResponse(protocolResponseSchema)) } }, async (r) => ({ data: await service.transition(r.params.id, r.body.to, { ...r.body, actorId: Number(r.user.id), requireAssignee: Number(r.user.role_id) !== 1 }), ok: true }));
    internal.post<{ Params: { id: string }; Body: ProtocolRequirementInput }>("/protocols/:id/requirements", { config: audit("CREATE", "id"), preHandler: requireCapability("route"), schema: { params: protocolParamsSchema, body: requirementBodySchema, response: responses(201, successResponse(protocolRequirementResponseSchema)) } }, async (r, reply) => reply.code(201).send({ data: await service.addRequirement(r.params.id, r.body, r.user), ok: true }));
    internal.post<{ Params: { id: string } }>("/protocols/:id/assume", { config: audit("UPDATE", "id"), preHandler: requireCapability("route"), schema: { params: protocolParamsSchema, response: responses(200, successResponse(protocolResponseSchema)) } }, async (r) => ({ data: await service.assume(r.params.id, r.user), ok: true }));
    internal.post<{ Params: { id: string }; Body: ProtocolForwardInput }>("/protocols/:id/forward", { config: audit("UPDATE", "id"), preHandler: requireCapability("route"), schema: { params: protocolParamsSchema, body: { type: "object", additionalProperties: false, required: ["toSectorId"], properties: { toSectorId: { type: "integer", minimum: 1 }, publicMessage: { type: "string", maxLength: 4000 }, internalMessage: { type: "string", maxLength: 4000 } } }, response: responses(200, successResponse(protocolResponseSchema)) } }, async (r) => ({ data: await service.forward(r.params.id, r.body.toSectorId, r.user, r.body.publicMessage, r.body.internalMessage), ok: true }));
    internal.post<{ Params: { id: string }; Body: Partial<ProtocolMessageInput> }>("/protocols/:id/return-to-triage", { config: audit("UPDATE", "id"), preHandler: requireCapability("route"), schema: { params: protocolParamsSchema, body: { type: "object", additionalProperties: false, properties: { message: { type: "string", maxLength: 4000 } } }, response: responses(200, successResponse(protocolResponseSchema)) } }, async (r) => ({ data: await service.returnToTriage(r.params.id, r.user, r.body?.message), ok: true }));
    internal.post<{ Params: { id: string }; Body: ProtocolMessageInput }>("/protocols/:id/notes", { config: audit("CREATE", "id"), preHandler: requireCapability("route"), schema: { params: protocolParamsSchema, body: { type: "object", additionalProperties: false, required: ["message"], properties: { message: { type: "string", minLength: 1, maxLength: 4000 } } }, response: responses(201, successResponse(protocolResponseSchema)) } }, async (r, reply) => reply.code(201).send({ data: await service.addInternalNote(r.params.id, r.user, r.body.message), ok: true }));
    internal.post("/protocols/:id/attachments", { config: audit("CREATE", "id"), preHandler: requireCapability("route"), schema: { params: protocolParamsSchema, querystring: attachmentQuerySchema, response: responses(201, successResponse(protocolAttachmentResponseSchema)) } }, async (r: FastifyRequest<{ Params: { id: string }; Querystring: { requirementId?: string } }>, reply) => upload(r, reply, "USER"));
    internal.get("/protocols/:id/attachments/:attachmentId", { config: audit("VIEW", "id"), preHandler: requireCapability("viewSector"), schema: { params: protocolAttachmentParamsSchema, response: responses(200, binaryResponseSchema) } }, async (r: FastifyRequest<{ Params: { id: string; attachmentId: string } }>, reply) => download(r, reply, false));
    internal.get("/services", { config: audit("LIST"), preHandler: requireCapability("manageCatalog"), schema: { response: responses(200, successResponse({ type: "array", items: protocolServiceResponseSchema })) } }, async () => ({ data: await service.listServiceCatalog(), ok: true }));
    internal.post("/services/drafts", { config: audit("CREATE"), preHandler: requireCapability("manageCatalog"), schema: { body: { type: "object", additionalProperties: false, required: ["name", "description", "deadlineDays", "fields"], properties: { name: { type: "string", minLength: 2, maxLength: 120 }, description: { type: "string", minLength: 2, maxLength: 4000 }, deadlineDays: { type: "integer", minimum: 1, maximum: 365 }, defaultSectorId: { type: ["integer", "null"], minimum: 1 }, protocolType: { type: "string", enum: protocolTypes }, fields: { type: "array", minItems: 1, maxItems: 100, items: fieldSchema } } }, response: responses(201, successResponse(protocolServiceDraftResponseSchema)) } }, async (r: FastifyRequest<{ Body: ProtocolServiceDraftInput }>, reply) => reply.code(201).send({ data: await service.createServiceWithDraft(r.body), ok: true }));
    internal.post("/services", { config: audit("CREATE"), preHandler: requireCapability("manageCatalog"), schema: { body: { type: "object", additionalProperties: false, required: ["name", "description", "deadlineDays"], properties: { name: { type: "string", minLength: 2, maxLength: 120 }, description: { type: "string", minLength: 2, maxLength: 4000 }, deadlineDays: { type: "integer", minimum: 1, maximum: 365 }, defaultSectorId: { type: ["integer", "null"], minimum: 1 }, active: { type: "boolean" }, protocolType: { type: "string", enum: protocolTypes } } }, response: responses(201, successResponse(protocolServiceResponseSchema)) } }, async (r: FastifyRequest<{ Body: ProtocolServiceInput }>, reply) => reply.code(201).send({ data: await service.createService(r.body), ok: true }));
    internal.post("/services/:id/forms", { config: audit("CREATE", "id"), preHandler: requireCapability("manageCatalog"), schema: { params: serviceParamsSchema, body: { type: "object", additionalProperties: false, required: ["fields"], properties: { fields: { type: "array", minItems: 1, maxItems: 100, items: fieldSchema } } }, response: responses(201, successResponse(protocolFormResponseSchema)) } }, async (r: FastifyRequest<{ Params: { id: string }; Body: ProtocolFormInput }>, reply) => reply.code(201).send({ data: await service.createForm(Number(r.params.id), r.body.fields), ok: true }));
    internal.post<{ Params: { id: string; formId: string } }>("/services/:id/forms/:formId/publish", { config: audit("UPDATE", "id"), preHandler: requireCapability("manageCatalog"), schema: { params: serviceFormParamsSchema, response: responses(200, successResponse(protocolFormResponseSchema)) } }, async (r) => ({ data: await service.publishForm(Number(r.params.id), Number(r.params.formId)), ok: true }));
    internal.get("/permissions/me", { config: audit("VIEW"), schema: { response: responses(200, successResponse(protocolCapabilitiesResponseSchema)) } }, async (r: FastifyRequest) => ({ data: await permissionService.getForRole(Number(r.user.role_id)), ok: true }));
    internal.get("/permissions", { config: audit("LIST"), preHandler: requireProtocolAdmin, schema: { response: responses(200, successResponse({ type: "array", items: protocolRolePermissionResponseSchema })) } }, async () => ({ data: await permissionService.list(), ok: true }));
    internal.put<{ Params: { roleId: string }; Body: ProtocolCapabilities }>("/permissions/:roleId", { config: audit("UPDATE", "roleId"), preHandler: requireProtocolAdmin, schema: { params: roleParamsSchema, body: protocolCapabilitiesBodySchema, response: responses(200, successResponse(protocolRolePermissionResponseSchema)) } }, async (r) => ({ data: await permissionService.update(Number(r.params.roleId), r.body), ok: true }));
    internal.get<{ Querystring: ProtocolPrivacyListQuery }>("/privacy-requests", { config: audit("LIST"), preHandler: requireCapability("managePrivacy"), schema: { querystring: { type: "object", additionalProperties: false, properties: { status: { type: "string", enum: privacyRequestStatuses } } }, response: responses(200, successResponse({ type: "array", items: internalPrivacyRequestResponseSchema })) } }, async (r) => ({ data: await privacyService.listInternal(r.query.status), ok: true }));
    internal.patch<{ Params: { requestId: string }; Body: ProtocolPrivacyUpdateInput }>("/privacy-requests/:requestId", { config: audit("UPDATE", "requestId"), preHandler: requireCapability("managePrivacy"), schema: { params: privacyRequestParamsSchema, body: privacyRequestUpdateSchema, response: responses(200, successResponse(internalPrivacyRequestResponseSchema)) } }, async (r) => ({ data: await privacyService.updateRequest(r.params.requestId, r.body, Number(r.user.id)), ok: true }));
    internal.post<{ Params: { id: string }; Body: ProtocolLegalHoldInput }>("/protocols/:id/legal-hold", { config: audit("UPDATE", "id"), preHandler: requireCapability("managePrivacy"), schema: { params: protocolParamsSchema, body: { type: "object", additionalProperties: false, required: ["active"], properties: { active: { type: "boolean" }, reason: { type: "string", minLength: 3, maxLength: 1000 } } }, response: responses(200, successResponse({ type: "object", additionalProperties: false, properties: { id: { type: "string", format: "uuid" }, publicNumber: { type: "string" }, legalHoldActive: { type: "boolean" }, legalHoldAt: { type: ["string", "null"], format: "date-time" } } })) } }, async (r) => ({ data: await privacyService.setLegalHold(r.params.id, r.body.active, r.body.reason, Number(r.user.id)), ok: true }));
    internal.get("/retention-preview", { config: audit("LIST"), preHandler: requireCapability("managePrivacy"), schema: { response: responses(200, successResponse(retentionPreviewResponseSchema)) } }, async () => ({ data: await privacyService.retentionPreview(), ok: true }));
    internal.get("/operations", { config: audit("VIEW"), preHandler: requireCapability("viewOperations"), schema: { response: responses(200, successResponse(protocolOperationsResponseSchema)) } }, async () => ({ data: await operationsService.snapshot(), ok: true }));
  }, { prefix: "/internal" });
};

type ProtocolUploadRequest = FastifyRequest<{ Params: { id: string }; Querystring: { requirementId?: string } }>;
type ProtocolDownloadRequest = FastifyRequest<{ Params: { id: string; attachmentId: string } }>;

async function upload(request: ProtocolUploadRequest, reply: FastifyReply, ownerType: "CITIZEN" | "USER") {
  const session = ownerType === "CITIZEN" ? publicSession(request) : null; if (session) await service.getCitizenProtocol(session, request.params.id);
  const attachmentModel = protocolModels().ProtocolAttachmentModel; const count = await attachmentModel.count({ where: { protocolId: request.params.id } }); if (count >= 20) throw new AppError("Limite de 20 anexos por protocolo atingido", 422, "ATTACHMENT_COUNT_LIMIT");
  if (request.query?.requirementId) { const requirement = await protocolModels().ProtocolRequirementModel.findOne({ where: { id: request.query.requirementId, protocolId: request.params.id } }); if (!requirement) throw new AppError("Exigencia nao pertence ao protocolo", 400, "INVALID_ATTACHMENT_REQUIREMENT"); }
  const file = await request.file(); if (!file) throw new AppError("Arquivo obrigatorio", 400); const chunks: Buffer[] = []; for await (const chunk of file.file) chunks.push(chunk); const buffer = Buffer.concat(chunks);
  const originalName = String(file.filename).slice(0, 255); const saved = await storage.store(buffer, file.mimetype, originalName); const model = attachmentModel;
  let attachment; try { attachment = await model.create({ protocolId: request.params.id, requirementId: request.query?.requirementId, originalName, storageKey: saved.key, mimeType: file.mimetype, size: saved.size, sha256: saved.sha256, status: "AVAILABLE", ownerType }); } catch (error) { await storage.remove(saved.key); throw error; }
  return reply.code(201).send({ data: { id: attachment.id, originalName: attachment.originalName, mimeType: attachment.mimeType, size: attachment.size, sha256: attachment.sha256 }, ok: true });
}

async function download(request: ProtocolDownloadRequest, reply: FastifyReply, citizen: boolean) {
  if (citizen) await service.getCitizenProtocol(publicSession(request), request.params.id); const model = protocolModels().ProtocolAttachmentModel;
  const attachment = await model.findOne({ where: { id: request.params.attachmentId, protocolId: request.params.id, status: "AVAILABLE" } }); if (!attachment) throw new AppError("Anexo nao encontrado", 404);
  reply.header("Content-Type", attachment.mimeType).header("Content-Disposition", `attachment; filename="${String(attachment.originalName).replace(/["\r\n]/g, "_")}"`).header("Cache-Control", "private, no-store").header("X-Content-Type-Options", "nosniff"); return reply.send(await storage.read(attachment.storageKey));
}
export default routes;
