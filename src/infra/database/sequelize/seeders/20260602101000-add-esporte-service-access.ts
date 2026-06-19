import { QueryInterface } from "sequelize";

const ESPORTE_SERVICE_ID = 10;
const DEFAULT_ROLES = [
  { id: 1, name: "admin" },
  { id: 2, name: "tecnico" },
  { id: 3, name: "Gestor" },
  { id: 4, name: "Usuario" },
];

/** @type {import("sequelize-cli").Migration} */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
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
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          { transaction },
        );
      } else {
        await queryInterface.bulkUpdate(
          "services",
          {
            name: "Atletas do Esporte",
            description: "Gerenciamento de atletas do esporte",
            url: "/services/10/esporte",
            tag: "outros",
            updatedAt: new Date(),
          },
          { id: ESPORTE_SERVICE_ID },
          { transaction },
        );
      }

      for (const role of DEFAULT_ROLES) {
        const roleExists = await queryInterface.rawSelect(
          "roles",
          {
            where: { id: role.id },
            transaction,
          },
          "id",
        );

        if (!roleExists) {
          await queryInterface.bulkInsert("roles", [role], { transaction });
        }
      }

      const roles = [
        { role_id: 1, read: 1, write: 1, edit: 1, del: 1 },
        { role_id: 2, read: 1, write: 1, edit: 1, del: 0 },
        { role_id: 3, read: 1, write: 1, edit: 1, del: 0 },
        { role_id: 4, read: 1, write: 1, edit: 0, del: 0 },
      ];

      for (const role of roles) {
        const roleExists = await queryInterface.rawSelect(
          "roles",
          {
            where: { id: role.role_id },
            transaction,
          },
          "id",
        );

        if (!roleExists) continue;

        const permissionExists = await queryInterface.rawSelect(
          "permissions",
          {
            where: {
              role_id: role.role_id,
              service_id: ESPORTE_SERVICE_ID,
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
                service_id: ESPORTE_SERVICE_ID,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
              },
            ],
            { transaction },
          );
        }
      }

      for (const setor_id of [1, 2]) {
        const visibilityExists = await queryInterface.rawSelect(
          "service_visibilities",
          {
            where: {
              setor_id,
              service_id: ESPORTE_SERVICE_ID,
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
                service_id: ESPORTE_SERVICE_ID,
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
