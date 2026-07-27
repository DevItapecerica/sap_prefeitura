import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import AppError from "../appError.js";
import { makeHttpRequestFailedEventPublisher } from "../../factories/http-request-failed-events.factory.js";
import { makeApplicationEventContext } from "../../infra/http/fastify/application-event-context.js";
import { HTTP_REQUEST_FAILED_EVENT } from "../event/http-request-failed.events.js";

const failedEvents = makeHttpRequestFailedEventPublisher();

const ErrorHook: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler(async (error, request, reply) => {
    request.log.error({
      err: error,
      route: request.url,
      userId: request.user?.id,
    });

    const errorData = error as {
      statusCode?: unknown;
      status?: unknown;
      code?: unknown;
      message?: unknown;
    };
    const declaredStatus =
      error instanceof AppError
        ? error.statusCode
        : Number(errorData.statusCode ?? errorData.status ?? 500);
    const statusCode =
      declaredStatus >= 400 && declaredStatus < 500 ? declaredStatus : 500;
    const code =
      error instanceof AppError
        ? error.code
        : typeof errorData.code === "string"
          ? errorData.code
        : statusCode < 500
          ? "BAD_REQUEST"
          : "INTERNAL_ERROR";
    const message =
      typeof errorData.message === "string" && statusCode < 500
        ? errorData.message
        : "Erro interno";
    const audit = request.routeOptions.config.audit;

    if (audit) {
      const accessDenied =
        audit.failureAction !== "LOGIN_FAILED" &&
        (statusCode === 401 || statusCode === 403);
      const params =
        request.params && typeof request.params === "object"
          ? (request.params as Record<string, unknown>)
          : {};
      try {
        await failedEvents.publish(HTTP_REQUEST_FAILED_EVENT, {
          context: makeApplicationEventContext(request),
          action: accessDenied ? "ACCESS_DENIED" : audit.failureAction,
          module: audit.module,
          resourceType: audit.resourceType,
          resourceId: audit.resourceIdParam
            ? String(params[audit.resourceIdParam] ?? "")
            : undefined,
          statusCode,
          errorCode: code,
          filters: request.query,
          requestedChanges:
            ["POST", "PUT", "PATCH", "DELETE"].includes(request.method) &&
            audit.failureAction !== "LOGIN_FAILED"
              ? request.body
              : undefined,
          attemptedIdentity:
            audit.failureAction === "LOGIN_FAILED"
              ? String((request.body as { email?: unknown } | undefined)?.email ?? "")
              : undefined,
        });
      } catch (auditError) {
        request.log.error(
          { err: auditError, requestId: request.id },
          "Unable to publish failed HTTP audit event",
        );
      }
    }

    return reply.status(statusCode).send({
      statusCode,
      message,
      code,
      ok: false,
    });
  });
};

export default fp(ErrorHook);
