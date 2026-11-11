import { QueryInterface, QueryTypes } from "sequelize";
import { FT_BENEFICIOS_ACTIONS } from "../../../../modules/acess-controll/domain/permission-catalog.js";
export default {
  async up(q: QueryInterface) {
    await q.sequelize.transaction(async (transaction) => {
      const [service] = await q.sequelize.query<{ module_key: string }>(
        "SELECT module_key FROM services WHERE id=6",
        { type: QueryTypes.SELECT, transaction },
      );
      if (service?.module_key !== "ft")
        throw new Error("FT service/module not configured");
      const existing = await q.sequelize.query<{ action: string }>(
        "SELECT action FROM permission_actions WHERE service_id=6 AND module_key='ft'",
        { type: QueryTypes.SELECT, transaction },
      );
      const now = new Date();
      for (const action of FT_BENEFICIOS_ACTIONS)
        if (!existing.some((row) => row.action === action))
          await q.bulkInsert(
            "permission_actions",
            [
              {
                service_id: 6,
                module_key: "ft",
                action,
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
      // Catalog only: never create grants or restore revoked access.
    });
  },
  async down(q: QueryInterface) {
    await q.sequelize.transaction(async (transaction) => {
      const [row] = await q.sequelize.query<{ total: number }>(
        "SELECT COUNT(*) AS total FROM role_permissions rp JOIN permission_actions p ON p.id=rp.permission_action_id WHERE p.module_key='ft' AND p.action IN (:actions)",
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { actions: [...FT_BENEFICIOS_ACTIONS] },
        },
      );
      if (Number(row.total))
        throw new Error(
          "Rollback refused: benefit permissions have configured grants",
        );
      await q.bulkDelete(
        "permission_actions",
        { module_key: "ft", action: [...FT_BENEFICIOS_ACTIONS] },
        { transaction },
      );
    });
  },
};
