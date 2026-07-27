import { FastifyPluginAsync, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import AppError from "../appError.js";
import { makeHttpRequestFailedEventPublisher } from "../../factories/http-request-failed-events.factory.js";
import { makeApplicationEventContext } from "../../infra/http/fastify/application-event-context.js";
import { HTTP_REQUEST_FAILED_EVENT } from "../event/http-request-failed.events.js";
import type { AuditableAction } from "../event/auditable-action.js";

const failedEvents = makeHttpRequestFailedEventPublisher();
const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

type ErrorData = {
  statusCode?: unknown;
  status?: unknown;
  code?: unknown;
  message?: unknown;
};

type NormalizedError = {
  statusCode: number;
  code: string;
  message: string;
};

const normalizeError = (error: unknown): NormalizedError => {
  const data = error as ErrorData;
  const declaredStatus =
    error instanceof AppError
      ? error.statusCode
      : Number(data.statusCode ?? data.status ?? 500);
  const statusCode =
    declaredStatus >= 400 && declaredStatus < 500 ? declaredStatus : 500;

  let code = statusCode < 500 ? "BAD_REQUEST" : "INTERNAL_ERROR";
  if (typeof data.code === "string") code = data.code;
  if (error instanceof AppError) code = error.code;

  const message =
    typeof data.message === "string" && statusCode < 500
      ? data.message
      : "Erro interno";
  return { statusCode, code, message };
};

const scalarToString = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  return undefined;
};

const getResourceId = (
  request: FastifyRequest,
  resourceIdParam?: string,
): string | undefined => {
  if (!resourceIdParam || typeof request.params !== "object") return undefined;
  const params = request.params as Record<string, unknown>;
  return scalarToString(params[resourceIdParam]);
};

const getAttemptedIdentity = (request: FastifyRequest): string | undefined => {
  if (typeof request.body !== "object" || request.body === null) return undefined;
  return scalarToString((request.body as Record<string, unknown>).email);
};

const resolveFailureAction = (
  action: AuditableAction,
  statusCode: number,
): AuditableAction => {
  if (action === "LOGIN_FAILED") return action;
  return statusCode === 401 || statusCode === 403 ? "ACCESS_DENIED" : action;
};

const publishAuditFailure = async (
  request: FastifyRequest,
  error: NormalizedError,
): Promise<void> => {
  const audit = request.routeOptions.config.audit;
  if (!audit) return;

  try {
    await failedEvents.publish(HTTP_REQUEST_FAILED_EVENT, {
      context: makeApplicationEventContext(request),
      action: resolveFailureAction(audit.failureAction, error.statusCode),
      module: audit.module,
      resourceType: audit.resourceType,
      resourceId: getResourceId(request, audit.resourceIdParam),
      statusCode: error.statusCode,
      errorCode: error.code,
      filters: request.query,
      requestedChanges:
        MUTATION_METHODS.has(request.method) &&
        audit.failureAction !== "LOGIN_FAILED"
          ? request.body
          : undefined,
      attemptedIdentity:
        audit.failureAction === "LOGIN_FAILED"
          ? getAttemptedIdentity(request)
          : undefined,
    });
  } catch (auditError) {
    request.log.error(
      { err: auditError, requestId: request.id },
      "Unable to publish failed HTTP audit event",
    );
  }
};

const ErrorHook: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler(async (error, request, reply) => {
    request.log.error({
      err: error,
      route: request.url,
      userId: request.user?.id,
    });

    const normalized = normalizeError(error);
    await publishAuditFailure(request, normalized);

    return reply.status(normalized.statusCode).send({
      ...normalized,
      ok: false,
    });
  });
};

export default fp(ErrorHook);
