import { QueryInterface } from "sequelize";
import { ensureServiceAccessDefaultsForSeed } from "./helpers/service-access-defaults.js";

const ESPORTE_SERVICE_ID = 10;

/** @type {import("sequelize-cli").Migration} */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const serviceExists = await queryInterface.rawSelect(
        "services",
        {
          where: { id: ESPORTE_SERVICE_ID },
          transaction,
        },
        ["id"],
      );

      if (!serviceExists) {
        await queryInterface.bulkInsert(
          "services",
          [
            {
              id: ESPORTE_SERVICE_ID,
              name: "Atletas do Esporte",
              description: "Gerenciamento de atletas do esporte",
              url: "/services/10/esporte",
              tag: "outros",
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      await ensureServiceAccessDefaultsForSeed(queryInterface, ESPORTE_SERVICE_ID, {
        transaction,
      });
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete(
        "service_visibilities",
        { service_id: ESPORTE_SERVICE_ID },
        { transaction },
      );
      await queryInterface.bulkDelete(
        "permissions",
        { service_id: ESPORTE_SERVICE_ID },
        { transaction },
      );
      await queryInterface.bulkDelete(
        "services",
        { id: ESPORTE_SERVICE_ID },
        { transaction },
      );
    });
  },
};
