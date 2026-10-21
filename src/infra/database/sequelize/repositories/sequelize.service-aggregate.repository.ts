import { Model, Transaction } from "sequelize";
import AppError from "../../../../core/appError.js";
import { Services } from "../../../../modules/services/domain/entity/Services.js";
import { ServiceVisibility } from "../../../../modules/services/domain/entity/ServiceVisibility.js";
import {
  ServiceAggregate,
  ServiceAggregateError,
  ServiceAggregateRepository,
  ServiceAggregateUpdate,
} from "../../../../modules/services/domain/repository/service-aggregate.repository.js";
import db from "../index.js";

export class SequelizeServiceAggregateRepository implements ServiceAggregateRepository {
  private readonly services;
  private readonly visibilities;

  constructor(private readonly database: typeof db = db) {
    this.services = database.ServiceModel;
    this.visibilities = database.ServiceVisibilities;
  }

  findById(id: number): Promise<ServiceAggregate | null> {
    return this.load(id);
  }

  update(
    id: number,
    input: ServiceAggregateUpdate,
  ): Promise<{ before: ServiceAggregate; after: ServiceAggregate }> {
    return this.database.sequelize.transaction(async (transaction) => {
      const rows = await this.loadRows(id, transaction, true);
      if (!rows) throw new ServiceAggregateError("SERVICE_NOT_FOUND");

      const before = this.toAggregate(rows);
      if ("permissions" in input) throw new AppError("Legacy permissions are not accepted",400,"VALIDATION_ERROR");
      this.validateVisibilities(id, input.visibility ?? [], before.visibility);

      await rows.service.update(
        {
          ...input.service,
          tag: input.service.tag ?? before.services.tag,
        },
        { transaction },
      );

      const visibilityRows = new Map(
        rows.visibilities.map((visibility) => [
          Number(visibility.get("id")),
          visibility,
        ]),
      );
      for (const visibility of input.visibility ?? []) {
        await visibilityRows
          .get(visibility.id)!
          .update({ visibility: visibility.visibility }, { transaction });
      }

      const afterRows = await this.loadRows(id, transaction, false);
      if (!afterRows) throw new ServiceAggregateError("SERVICE_NOT_FOUND");
      return { before, after: this.toAggregate(afterRows) };
    });
  }

  private async load(
    id: number,
    transaction?: Transaction,
  ): Promise<ServiceAggregate | null> {
    const rows = await this.loadRows(id, transaction, false);
    return rows ? this.toAggregate(rows) : null;
  }

  private async loadRows(
    id: number,
    transaction?: Transaction,
    lock = false,
  ): Promise<{
    service: Model;
    permissions: Model[];
    visibilities: Model[];
  } | null> {
    const lockOption =
      lock && transaction ? transaction.LOCK.UPDATE : undefined;
    const service = await this.services.findByPk(id, {
      transaction,
      lock: lockOption,
    });
    if (!service) return null;

    const visibilities = await this.visibilities.findAll({
      where: { service_id: id },
      transaction,
      lock: lockOption,
    });
    return { service, permissions: [], visibilities };
  }

  private validateVisibilities(
    serviceId: number,
    requested: NonNullable<ServiceAggregateUpdate["visibility"]>,
    existing: ServiceVisibility[],
  ): void {
    const byId = new Map(existing.map((item) => [item.id, item]));
    const requestedIds = new Set<number>();
    for (const item of requested) {
      const stored = byId.get(item.id);
      if (
        requestedIds.has(item.id) ||
        stored?.service_id !== serviceId ||
        item.service_id !== serviceId ||
        stored?.setor_id !== item.setor_id
      ) {
        throw new ServiceAggregateError("VISIBILITY_NOT_FOUND");
      }
      requestedIds.add(item.id);
    }
  }

  private toAggregate(rows: {
    service: Model;
    permissions: Model[];
    visibilities: Model[];
  }): ServiceAggregate {
    const service = rows.service.get() as Record<string, unknown>;
    return {
      services: new Services(
        Number(service.id),
        String(service.name),
        service.description == null ? null : String(service.description),
        String(service.tag),
        String(service.url),
        service.createdAt as Date,
        service.updatedAt as Date,
        (service.deletedAt as Date | null) ?? null,
      ),
      permissions: [],
      visibility: rows.visibilities.map((row) => {
        const item = row.get() as Record<string, unknown>;
        return new ServiceVisibility(
          Number(item.setor_id),
          Number(item.service_id),
          Boolean(item.visibility),
          Number(item.id),
        );
      }),
    };
  }
}
