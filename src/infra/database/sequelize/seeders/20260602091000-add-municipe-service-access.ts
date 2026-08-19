import { QueryInterface } from "sequelize";
import { ensureServiceAccessDefaultsForSeed } from "./helpers/service-access-defaults.js";

const MUNICIPE_SERVICE_ID = 9;

/** @type {import("sequelize-cli").Migration} */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const serviceExists = await queryInterface.rawSelect(
        "services",
        {
          where: { id: MUNICIPE_SERVICE_ID },
          transaction,
        },
        "id",
      );

      if (!serviceExists) {
        await queryInterface.bulkInsert(
          "services",
          [
            {
              id: MUNICIPE_SERVICE_ID,
              name: "Municipes",
              description: "Cadastro e consulta de municipes",
              url: "/services/9/municipes",
              tag: "outros",
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      await ensureServiceAccessDefaultsForSeed(
        queryInterface,
        MUNICIPE_SERVICE_ID,
        { transaction },
      );
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete(
        "service_visibilities",
        { service_id: MUNICIPE_SERVICE_ID },
        { transaction },
      );
      await queryInterface.bulkDelete(
        "permissions",
        { service_id: MUNICIPE_SERVICE_ID },
        { transaction },
      );
      await queryInterface.bulkDelete(
        "services",
        { id: MUNICIPE_SERVICE_ID },
        { transaction },
      );
    });
  },
};
