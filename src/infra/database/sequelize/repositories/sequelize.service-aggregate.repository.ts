import { Model, Transaction } from "sequelize";
import { Permissions } from "../../../../modules/permission/domain/entity/Permission.js";
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
  private readonly permissions;
  private readonly visibilities;

  constructor(private readonly database: typeof db = db) {
    this.services = database.ServiceModel;
    this.permissions = database.PermissionsModel;
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
      this.validatePermissions(id, input.permissions ?? [], before.permissions);
      this.validateVisibilities(id, input.visibility ?? [], before.visibility);

      await rows.service.update(
        {
          ...input.service,
          tag: input.service.tag ?? before.services.tag,
        },
        { transaction },
      );

      const permissionRows = new Map(
        rows.permissions.map((permission) => [
          Number(permission.get("id")),
          permission,
        ]),
      );

      for (const permission of input.permissions ?? []) {
        await permissionRows.get(permission.id)!.update(
          {
            read: permission.read,
            write: permission.write,
            edit: permission.edit,
            del: permission.del,
          },
          { transaction },
        );
      }

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

  delete(id: number): Promise<{ before: ServiceAggregate; after: null }> {
    return this.database.sequelize.transaction(async (transaction) => {
      const rows = await this.loadRows(id, transaction, true);
      if (!rows) throw new ServiceAggregateError("SERVICE_NOT_FOUND");

      const before = this.toAggregate(rows);
      await rows.service.destroy({ transaction });
      return { before, after: null };
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

    const permissions = await this.permissions.findAll({
      where: { service_id: id },
      transaction,
      lock: lockOption,
    });
    const visibilities = await this.visibilities.findAll({
      where: { service_id: id },
      transaction,
      lock: lockOption,
    });
    return { service, permissions, visibilities };
  }

  private validatePermissions(
    serviceId: number,
    requested: NonNullable<ServiceAggregateUpdate["permissions"]>,
    existing: Permissions[],
  ): void {
    const byId = new Map(existing.map((item) => [item.id, item]));
    const requestedIds = new Set<number>();
    for (const item of requested) {
      const stored = byId.get(item.id);
      if (
        requestedIds.has(item.id) ||
        stored?.service_id !== serviceId ||
        item.service_id !== serviceId ||
        stored?.role_id !== item.role_id
      ) {
        throw new ServiceAggregateError("PERMISSION_NOT_FOUND");
      }
      requestedIds.add(item.id);
    }
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
        service.description == null ? null : JSON.stringify(service.description),
        String(service.tag),
        String(service.url),
        service.createdAt as Date,
        service.updatedAt as Date,
        (service.deletedAt as Date | null) ?? null,
      ),
      permissions: rows.permissions.map((row) => {
        const item = row.get() as Record<string, unknown>;
        return new Permissions(
          Number(item.service_id),
          Number(item.role_id),
          Boolean(item.read),
          Boolean(item.write),
          Boolean(item.edit),
          Boolean(item.del),
          Number(item.id),
        );
      }),
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
