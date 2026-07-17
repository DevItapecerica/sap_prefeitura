import { FastifyReply, FastifyRequest } from "fastify";
import { AuditQueryDto } from "../application/dto/audit.dto.js";
import { makeAuditService } from "../factories/makeAuditService.js";

const service = makeAuditService();

export class AuditController {
  static list = async (request: FastifyRequest<{ Querystring: AuditQueryDto }>, reply: FastifyReply) => {
    const data = await service.list(request.query);
    return reply.status(200).send({ data: data.rows, count: data.count, ok: true });
  };
  static detail = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const data = await service.detail(request.params.id);
    return reply.status(200).send({ data, ok: true });
  };
  static export = async (request: FastifyRequest<{ Body: AuditQueryDto }>, reply: FastifyReply) => {
    const rows = await service.export(request.body ?? {});
    const columns = ["id", "occurredAt", "actorUserId", "actorRoleId", "actorSetorId", "action", "module", "resourceType", "resourceId", "result", "requestId", "ip", "method", "route"];
    const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [columns.join(","), ...rows.map((row) => columns.map((column) => escape(row[column])).join(","))].join("\n");
    return reply.header("content-type", "text/csv; charset=utf-8").header("content-disposition", "attachment; filename=audit.csv").send(csv);
  };
}
