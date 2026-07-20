import { FastifyBaseLogger } from "fastify";
import { ApplicationEventContext } from "../../../core/event/application-event.js";
import { RecordAuditDto } from "../application/dto/audit.dto.js";
import { markAuditRequestHandled } from "./audit-request-registry.js";

export interface AuditRecorder {
  record(input: RecordAuditDto): Promise<unknown>;
}

export interface AuditableApplicationEvent {
  context: ApplicationEventContext;
}

export const makeAuditBaseRecord = (
  event: AuditableApplicationEvent,
  module: string,
  resourceType: string,
): Omit<RecordAuditDto, "action" | "resourceId"> => ({
  actor: {
    userId: event.context.actor?.id ?? null,
    name: event.context.actor?.name ?? null,
    roleId: event.context.actor?.roleId ?? null,
    setorId: event.context.actor?.setorId ?? null,
  },
  module,
  resourceType,
  result: "SUCCESS",
  requestId: event.context.correlationId,
  ip: event.context.origin?.ip ?? null,
  method: event.context.origin?.method ?? null,
  route: event.context.origin?.route ?? null,
});

export const recordAuditEvent = async (
  event: AuditableApplicationEvent,
  input: RecordAuditDto,
  auditService: AuditRecorder,
  logger: Pick<FastifyBaseLogger, "error">,
): Promise<void> => {
  try {
    await auditService.record(input);
    markAuditRequestHandled(event.context.correlationId);
  } catch (error) {
    logger.error(
      { err: error, requestId: event.context.correlationId },
      `Unable to enqueue ${input.module} audit event`,
    );
  }
};
