import { FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { AuditAction } from "../domain/entity/AuditEvent.js";
import { sanitizeAuditValue } from "../application/utils/audit-sanitizer.js";
import { makeAuditService } from "../factories/makeAuditService.js";
import { consumeAuditRequestHandled } from "../events/audit-request-registry.js";
import { RecordAuditDto } from "../application/dto/audit.dto.js";
import { verifyAuditResult } from "../domain/services/verifyAuditResult.service.js";
import { formatMetaDataRequest } from "../domain/services/verifyAuditResult.service copy.js";

interface AuditRecorder {
  record(input: RecordAuditDto): Promise<unknown>;
}

const parsePayload = (payload: unknown): unknown => {
  if (typeof payload !== "string") return payload;
  try {
    return JSON.parse(payload);
  } catch {
    return undefined;
  }
};

const routeParts = (request: FastifyRequest) =>
  request.url
    .split("?")[0]
    .split("/")
    .filter(Boolean)
    .filter((part) => part !== "api" && part !== "v2");

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
    return last && (/^\d+$/.test(last) || /^[0-9a-f-]{20,}$/i.test(last))
      ? "VIEW"
      : "LIST";
  }
  return null;
}

const resultCount = (response: any): number | null => {
  if (!response || typeof response !== "object") return null;
  if (typeof response.count === "number") return response.count;
  for (const value of Object.values(response))
    if (Array.isArray(value)) return value.length;
  return null;
};

export const makeAuditHttpHook = (service: AuditRecorder) =>
  fp(async (fastify) => {
    fastify.addHook("onSend", async (request, _reply, payload) => {
      request.auditResponse = sanitizeAuditValue(parsePayload(payload));
      return payload;
    });
    fastify.addHook("onResponse", async (request, reply) => {
      if (reply.statusCode < 400 && consumeAuditRequestHandled(request.id)) {
        return;
      }
      const action = classify(request, reply.statusCode);
      const isAuthRoute =
        request.url.includes("/login") || request.url.includes("/logout");
      if (
        !action ||
        (!request.user && !isAuthRoute && reply.statusCode !== 403)
      )
        return;
      const parts = routeParts(request);
      const moduleName = parts[0] ?? "unknown";
      const resourceId =
        request.params && typeof request.params === "object"
          ? Object.values(request.params as Record<string, unknown>)[0]
          : null;
      const response: any = request.auditResponse;
      const actor =
        request.user ?? (action === "LOGIN" ? response?.user : undefined);
      const result = verifyAuditResult(reply.statusCode);
      let metadata = formatMetaDataRequest(action, request.body);

      if (action === "LOGIN_FAILED") {
        metadata = { attemptedIdentity: (request.body as any)?.email };
      } else if (["CREATE", "UPDATE", "DELETE"].includes(action)) {
        metadata = { requestedChanges: request.body };
      }

      try {
        await service.record({
          actor: {
            userId: actor?.id ?? null,
            name: actor?.name ?? null,
            roleId: actor?.role_id ?? null,
            setorId: actor?.setor_id ?? null,
          },
          action,
          module: moduleName,
          resourceType: moduleName,
          resourceId:
            resourceId === undefined || resourceId === null
              ? null
              : String(resourceId),
          result,
          errorCode:
            response?.code ??
            (reply.statusCode >= 400 ? String(reply.statusCode) : null),
          requestId: request.id,
          ip: request.ip,
          method: request.method,
          route: request.routeOptions.url ?? request.url.split("?")[0],
          filters: request.query,
          returnedCount: resultCount(response),
          after: ["CREATE", "UPDATE"].includes(action) ? response : undefined,
          metadata,
        });
      } catch (error) {
        request.log.error(
          { err: error, requestId: request.id },
          "Unable to enqueue audit event",
        );
      }
    });
  });

export default makeAuditHttpHook(makeAuditService());
