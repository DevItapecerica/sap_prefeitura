import { QueryInterface } from "sequelize";
import { ensureServiceAccessDefaultsForSeed } from "./helpers/service-access-defaults.js";

const AUDIT_SERVICE_ID = 11;

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const exists = await queryInterface.rawSelect(
        "services",
        { where: { id: AUDIT_SERVICE_ID }, transaction },
        "id",
      );

      if (!exists) {
        await queryInterface.bulkInsert("services", [{
          id: AUDIT_SERVICE_ID,
          name: "Auditoria",
          description: "Consulta e exportacao de eventos de auditoria",
          url: "/services/11/admin/audit",
          tag: "admin",
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }], { transaction });
      }

      await ensureServiceAccessDefaultsForSeed(
        queryInterface,
        AUDIT_SERVICE_ID,
        { transaction },
      );
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete("service_visibilities", { service_id: AUDIT_SERVICE_ID }, { transaction });
      await queryInterface.bulkDelete("permissions", { service_id: AUDIT_SERVICE_ID }, { transaction });
      await queryInterface.bulkDelete("services", { id: AUDIT_SERVICE_ID }, { transaction });
    });
  },
};
