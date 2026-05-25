import { QueryInterface } from "sequelize";

const CHAMADOS_SERVICE_ID = 8;

/** @type {import("sequelize-cli").Migration} */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const serviceExists = await queryInterface.rawSelect(
        "services",
        {
          where: { id: CHAMADOS_SERVICE_ID },
          transaction,
        },
        ["id"],
      );

      if (!serviceExists) {
        await queryInterface.bulkInsert(
          "services",
          [
            {
              id: CHAMADOS_SERVICE_ID,
              name: "Chamados",
              description: "Gerenciamento de chamados",
              url: "/services/8/chamados",
              tag: "TI",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          { transaction },
        );
      }

      const roles = [
        { role_id: 1, read: 1, write: 1, edit: 1, del: 1 },
        { role_id: 2, read: 1, write: 1, edit: 1, del: 0 },
        { role_id: 3, read: 1, write: 1, edit: 1, del: 0 },
        { role_id: 4, read: 1, write: 1, edit: 0, del: 0 },
      ];

      for (const role of roles) {
        const permissionExists = await queryInterface.rawSelect(
          "permissions",
          {
            where: {
              role_id: role.role_id,
              service_id: CHAMADOS_SERVICE_ID,
            },
            transaction,
          },
          ["id"],
        );

        if (!permissionExists) {
          await queryInterface.bulkInsert(
            "permissions",
            [
              {
                ...role,
                service_id: CHAMADOS_SERVICE_ID,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
              },
            ],
            { transaction },
          );
        }
      }

      const setorIds = [1, 2];

      for (const setor_id of setorIds) {
        const visibilityExists = await queryInterface.rawSelect(
          "service_visibilities",
          {
            where: {
              setor_id,
              service_id: CHAMADOS_SERVICE_ID,
            },
            transaction,
          },
          ["id"],
        );

        if (!visibilityExists) {
          await queryInterface.bulkInsert(
            "service_visibilities",
            [
              {
                setor_id,
                service_id: CHAMADOS_SERVICE_ID,
                visibility: 1,
              },
            ],
            { transaction },
          );
        }
      }
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete(
        "service_visibilities",
        { service_id: CHAMADOS_SERVICE_ID },
        { transaction },
      );
      await queryInterface.bulkDelete(
        "permissions",
        { service_id: CHAMADOS_SERVICE_ID },
        { transaction },
      );
      await queryInterface.bulkDelete(
        "services",
        { id: CHAMADOS_SERVICE_ID },
        { transaction },
      );
    });
  },
};
