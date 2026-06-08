import { QueryInterface } from "sequelize";

const OLD_ESPORTE_SERVICE_ID = 9;
const ESPORTE_SERVICE_ID = 11;

const isEsporteService = (value: unknown): boolean =>
  typeof value === "string" && value.toLowerCase() === "esporte";

/** @type {import("sequelize-cli").Migration} */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const oldServiceName = await queryInterface.rawSelect(
        "services",
        {
          where: { id: OLD_ESPORTE_SERVICE_ID },
          transaction,
        },
        "name",
      );

      if (!isEsporteService(oldServiceName)) return;

      const targetServiceExists = await queryInterface.rawSelect(
        "services",
        {
          where: { id: ESPORTE_SERVICE_ID },
          transaction,
        },
        "id",
      );

      for (const role_id of [1, 2, 3, 4]) {
        const oldPermissionId = await queryInterface.rawSelect(
          "permissions",
          {
            where: {
              role_id,
              service_id: OLD_ESPORTE_SERVICE_ID,
            },
            transaction,
          },
          "id",
        );

        if (!oldPermissionId) continue;

        const targetPermissionId = await queryInterface.rawSelect(
          "permissions",
          {
            where: {
              role_id,
              service_id: ESPORTE_SERVICE_ID,
            },
            transaction,
          },
          "id",
        );

        if (targetPermissionId) {
          await queryInterface.bulkDelete(
            "permissions",
            { id: oldPermissionId },
            { transaction },
          );
        } else {
          await queryInterface.bulkUpdate(
            "permissions",
            {
              service_id: ESPORTE_SERVICE_ID,
              updatedAt: new Date(),
            },
            { id: oldPermissionId },
            { transaction },
          );
        }
      }

      for (const setor_id of [1, 2]) {
        const oldVisibilityId = await queryInterface.rawSelect(
          "service_visibilities",
          {
            where: {
              setor_id,
              service_id: OLD_ESPORTE_SERVICE_ID,
            },
            transaction,
          },
          "id",
        );

        if (!oldVisibilityId) continue;

        const targetVisibilityId = await queryInterface.rawSelect(
          "service_visibilities",
          {
            where: {
              setor_id,
              service_id: ESPORTE_SERVICE_ID,
            },
            transaction,
          },
          "id",
        );

        if (targetVisibilityId) {
          await queryInterface.bulkDelete(
            "service_visibilities",
            { id: oldVisibilityId },
            { transaction },
          );
        } else {
          await queryInterface.bulkUpdate(
            "service_visibilities",
            { service_id: ESPORTE_SERVICE_ID },
            { id: oldVisibilityId },
            { transaction },
          );
        }
      }

      if (targetServiceExists) {
        await queryInterface.bulkDelete(
          "services",
          { id: OLD_ESPORTE_SERVICE_ID },
          { transaction },
        );
      } else {
        await queryInterface.bulkUpdate(
          "services",
          {
            id: ESPORTE_SERVICE_ID,
            url: "/services/11/esporte",
            updatedAt: new Date(),
          },
          { id: OLD_ESPORTE_SERVICE_ID },
          { transaction },
        );
      }
    });
  },

  down: async (): Promise<void> => {
    // Backfill-only seeder. The reverse would make service id 9 ambiguous.
  },
};
