import { Op, Transaction, WhereOptions } from "sequelize";
import {
  AuditOutboxItemDto,
  AuditQueryDto,
} from "../../../../modules/audit/application/dto/audit.dto.js";
import { StoredAuditEvent } from "../../../../modules/audit/domain/entity/AuditEvent.js";
import AuditRepository from "../../../../modules/audit/domain/repository/audit.repository.js";
import db from "../index.js";

export class SequelizeAuditRepository implements AuditRepository {
  private outbox = db.AuditOutboxModel;
  private logs = db.AuditLogModel;

  async enqueue(event: StoredAuditEvent, transaction?: unknown): Promise<void> {
    await this.outbox.findOrCreate({
      where: { eventId: event.eventId },
      defaults: {
        eventId: event.eventId,
        payload: JSON.stringify(event),
        status: "PENDING",
        attempts: 0,
        nextAttemptAt: new Date(),
      },
      transaction: transaction as Transaction | undefined,
    });
  }

  async claimBatch(
    now: Date,
    staleBefore: Date,
    limit = 50,
  ): Promise<AuditOutboxItemDto[]> {
    await this.outbox.update(
      {
        status: "FAILED",
        nextAttemptAt: now,
        lastError: "Recovered after interrupted processing",
      },
      { where: { status: "PROCESSING", updatedAt: { [Op.lt]: staleBefore } } },
    );
    const rows = await this.outbox.findAll({
      where: {
        status: { [Op.in]: ["PENDING", "FAILED"] },
        nextAttemptAt: { [Op.lte]: now },
      },
      order: [["id", "ASC"]],
      limit,
    });
    const claimed: AuditOutboxItemDto[] = [];
    for (const row of rows) {
      const [count] = await this.outbox.update(
        { status: "PROCESSING" },
        {
          where: {
            id: row.get("id"),
            status: { [Op.in]: ["PENDING", "FAILED"] },
          },
        },
      );
      if (count === 1)
        claimed.push({
          id: row.get("id") as string | number,
          eventId: String(row.get("eventId")),
          payload: String(row.get("payload")),
          attempts: Number(row.get("attempts")),
        });
    }
    return claimed;
  }

  async persist(item: AuditOutboxItemDto): Promise<void> {
    const event = JSON.parse(item.payload) as StoredAuditEvent;
    await db.sequelize.transaction(async (transaction) => {
      await this.logs.findOrCreate({
        where: { eventId: event.eventId },
        transaction,
        defaults: {
          eventId: event.eventId,
          occurredAt: new Date(event.occurredAt),
          actorUserId: event.actor.userId ?? null,
          actorName: event.actor.name ?? null,
          actorRoleId: event.actor.roleId ?? null,
          actorSetorId: event.actor.setorId ?? null,
          action: event.action,
          module: event.module,
          resourceType: event.resourceType,
          resourceId: event.resourceId ?? null,
          result: event.result,
          errorCode: event.errorCode ?? null,
          requestId: event.requestId ?? null,
          ip: event.ip ?? null,
          method: event.method ?? null,
          route: event.route ?? null,
          filtersJson:
            event.filters === undefined ? null : JSON.stringify(event.filters),
          returnedCount: event.returnedCount ?? null,
          beforeEncrypted: event.beforeEncrypted ?? null,
          afterEncrypted: event.afterEncrypted ?? null,
          metadataEncrypted: event.metadataEncrypted ?? null,
          createdAt: new Date(),
        },
      });
      await this.outbox.update(
        { status: "PROCESSED", processedAt: new Date(), lastError: null },
        { where: { id: item.id }, transaction },
      );
    });
  }

  async markFailed(
    item: AuditOutboxItemDto,
    error: unknown,
    nextAttemptAt: Date,
  ): Promise<void> {
    await this.outbox.update(
      {
        status: "FAILED",
        attempts: item.attempts + 1,
        lastError:
          error instanceof Error
            ? error.message.slice(0, 4000)
            : String(error).slice(0, 4000),
        nextAttemptAt,
      },
      { where: { id: item.id } },
    );
  }

  async list(
    query: AuditQueryDto,
  ): Promise<{ rows: Record<string, any>[]; count: number }> {
    const where: WhereOptions = {};
    if (query.from || query.to)
      (where as any).occurredAt = {
        ...(query.from && { [Op.gte]: new Date(query.from) }),
        ...(query.to && { [Op.lte]: new Date(query.to) }),
      };
    for (const [input, field] of [
      ["userId", "actorUserId"],
      ["setorId", "actorSetorId"],
      ["module", "module"],
      ["action", "action"],
      ["resourceType", "resourceType"],
      ["resourceId", "resourceId"],
      ["result", "result"],
      ["requestId", "requestId"],
    ] as const) {
      if (query[input] !== undefined) (where as any)[field] = query[input];
    }
    const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200);
    const page = Math.max(Number(query.page) || 0, 0);
    const result = await this.logs.findAndCountAll({
      where,
      limit,
      offset: page * limit,
      order: [["occurredAt", "DESC"]],
      attributes: {
        exclude: ["beforeEncrypted", "afterEncrypted", "metadataEncrypted"],
      },
    });
    return {
      rows: result.rows.map((row: any) => row.toJSON()),
      count: result.count,
    };
  }

  async detail(id: string): Promise<Record<string, any> | null> {
    const row: any = await this.logs.findByPk(id);
    return row ? row.toJSON() : null;
  }

  async export(query: AuditQueryDto): Promise<Record<string, any>[]> {
    const rows: Record<string, any>[] = [];
    for (let page = 0; page < 50; page++) {
      const batch = await this.list({ ...query, page, limit: 200 });
      rows.push(...batch.rows);
      if (batch.rows.length < 200) break;
    }
    return rows;
  }

  purge(before: Date): Promise<number> {
    return this.logs.destroy({ where: { occurredAt: { [Op.lt]: before } } });
  }
  backlog(): Promise<number> {
    return this.outbox.count({ where: { status: { [Op.ne]: "PROCESSED" } } });
  }
}
