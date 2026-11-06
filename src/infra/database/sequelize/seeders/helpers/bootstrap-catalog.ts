import { QueryInterface, QueryTypes, Transaction } from "sequelize";
import { PERMISSION_CATALOG } from "../../../../../modules/acess-controll/domain/permission-catalog.js";

export async function seedPermissionCatalog(
  query: QueryInterface,
  transaction: Transaction,
): Promise<void> {
  const actions = await query.sequelize.query<{
    id: number;
    service_id: number;
    module_key: string;
    action: string;
  }>(
    "SELECT id, service_id, module_key, action FROM permission_actions ORDER BY id",
    { type: QueryTypes.SELECT, transaction },
  );
  const services = await query.sequelize.query<{
    id: number;
    module_key: string;
  }>("SELECT id, module_key FROM services", {
    type: QueryTypes.SELECT,
    transaction,
  });
  const now = new Date();
  for (const entry of PERMISSION_CATALOG) {
    if (
      !services.some(
        (service) =>
          service.id === entry.serviceId && service.module_key === entry.module,
      )
    )
      throw new Error("Seed active services before permission actions");
    const existing = actions.find(
      (action) =>
        action.module_key === entry.module && action.action === entry.action,
    );
    if (existing) {
      if (existing.service_id !== entry.serviceId)
        throw new Error("Permission action belongs to an unexpected service");
      continue;
    }
    await query.bulkInsert(
      "permission_actions",
      [
        {
          service_id: entry.serviceId,
          module_key: entry.module,
          action: entry.action,
          createdAt: now,
          updatedAt: now,
        },
      ],
      { transaction },
    );
  }
}
