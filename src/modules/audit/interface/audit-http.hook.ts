import { FastifyPluginAsync, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { AuditAction, AuditResult } from "../domain/entity/AuditEvent.js";
import { sanitizeAuditValue } from "../application/utils/audit-sanitizer.js";
import { makeAuditService } from "../factories/makeAuditService.js";

const parsePayload = (payload: unknown): unknown => {
  if (typeof payload !== "string") return payload;
  try { return JSON.parse(payload); } catch { return undefined; }
};

const routeParts = (request: FastifyRequest) => request.url.split("?")[0].split("/").filter(Boolean).filter((part) => part !== "api" && part !== "v2");

function classify(request: FastifyRequest, status: number): AuditAction | null {
  const path = request.url.toLowerCase();
  if (status === 403) return "ACCESS_DENIED";
  if (path.endsWith("/login")) return status < 400 ? "LOGIN" : "LOGIN_FAILED";
  if (path.endsWith("/logout")) return "LOGOUT";
  if (path.includes("alter_password")) return "PASSWORD_CHANGED";
  if (path.includes("export") || path.includes("relatorio")) return "EXPORT";
  if (request.method === "POST") return "CREATE";
  if (["PUT", "PATCH"].includes(request.method)) return "UPDATE";
  if (request.method === "DELETE") return "DELETE";
  if (request.method === "GET") {
    const parts = routeParts(request);
    const last = parts.at(-1);
    return last && (/^\d+$/.test(last) || /^[0-9a-f-]{20,}$/i.test(last)) ? "VIEW" : "LIST";
  }
  return null;
}

const resultCount = (response: any): number | null => {
  if (!response || typeof response !== "object") return null;
  if (typeof response.count === "number") return response.count;
  for (const value of Object.values(response)) if (Array.isArray(value)) return value.length;
  return null;
};

const service = makeAuditService();

const AuditHttpHook: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("onSend", async (request, _reply, payload) => {
    request.auditResponse = sanitizeAuditValue(parsePayload(payload));
    return payload;
  });
  fastify.addHook("onResponse", async (request, reply) => {
    const action = classify(request, reply.statusCode);
    const isAuthRoute = request.url.includes("/login") || request.url.includes("/logout");
    if (!action || (!request.user && !isAuthRoute && reply.statusCode !== 403)) return;
    const parts = routeParts(request);
    const moduleName = parts[0] ?? "unknown";
    const resourceId = (request.params && typeof request.params === "object") ? Object.values(request.params as Record<string, unknown>)[0] : null;
    const response: any = request.auditResponse;
    const actor = request.user ?? (action === "LOGIN" ? response?.user : undefined);
    const result: AuditResult = reply.statusCode === 403 ? "DENIED" : reply.statusCode >= 400 ? "FAILURE" : "SUCCESS";
    try {
      await service.record({
        actor: { userId: actor?.id ?? null, name: actor?.name ?? null, roleId: actor?.role_id ?? null, setorId: actor?.setor_id ?? null },
        action, module: moduleName, resourceType: moduleName, resourceId: resourceId === undefined || resourceId === null ? null : String(resourceId),
        result, errorCode: response?.code ?? (reply.statusCode >= 400 ? String(reply.statusCode) : null), requestId: request.id,
        ip: request.ip, method: request.method, route: request.routeOptions.url ?? request.url.split("?")[0],
        filters: request.query, returnedCount: resultCount(response),
        after: ["CREATE", "UPDATE"].includes(action) ? response : undefined,
        metadata: action === "LOGIN_FAILED"
          ? { attemptedIdentity: (request.body as any)?.email }
          : ["CREATE", "UPDATE", "DELETE"].includes(action) ? { requestedChanges: request.body } : undefined,
      });
    } catch (error) { request.log.error({ err: error, requestId: request.id }, "Unable to enqueue audit event"); }
  });
};

export default fp(AuditHttpHook);
