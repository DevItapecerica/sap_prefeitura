import { QueryInterface, QueryTypes } from "sequelize";

const ESPORTE_SERVICE_ID = 10;

type RoleRow = {
  id: number;
  name: string;
};

type SetorRow = {
  id: number;
};

const isAdminRole = (role: RoleRow) =>
  role.id === 1 || role.name.toLowerCase() === "admin";

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

      const roles = await queryInterface.sequelize.query<RoleRow>(
        "SELECT id, name FROM roles ORDER BY id",
        { type: QueryTypes.SELECT, transaction },
      );

      for (const role of roles) {
        const allowed = isAdminRole(role) ? 1 : 0;
        const permissionExists = await queryInterface.rawSelect(
          "permissions",
          {
            where: {
              role_id: role.id,
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
                role_id: role.id,
                service_id: ESPORTE_SERVICE_ID,
                read: allowed,
                write: allowed,
                edit: allowed,
                del: allowed,
                createdAt: now,
                updatedAt: now,
                deletedAt: null,
              },
            ],
            { transaction },
          );
        }
      }

      const setores = await queryInterface.sequelize.query<SetorRow>(
        "SELECT id FROM setors ORDER BY id",
        { type: QueryTypes.SELECT, transaction },
      );

      for (const setor of setores) {
        const visibilityExists = await queryInterface.rawSelect(
          "service_visibilities",
          {
            where: {
              setor_id: setor.id,
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
                setor_id: setor.id,
                service_id: ESPORTE_SERVICE_ID,
                visibility: setor.id === 1 ? 1 : 0,
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
