"use strict";

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    const payload = [
      {
        table: "roles",
        data: [
          { id: 1, name: "admin" },
          { id: 2, name: "tecnico" },
          { id: 3, name: "Gestor" },
          { id: 4, name: "Usuário" },
        ],
      },
      {
        table: "permissions",
        data: [
          {
            id: 1,
            role_id: 1,
            service_id: 1,
            read: 1,
            write: 1,
            edit: 1,
            del: 1,
            createdAt: "2025-06-04 13:33:14",
            updatedAt: "2025-10-02 13:06:26",
            deletedAt: null,
          },
          {
            id: 25,
            role_id: 1,
            service_id: 7,
            read: 1,
            write: 1,
            edit: 1,
            del: 1,
            createdAt: "2025-09-24 13:21:58",
            updatedAt: "2025-10-02 13:05:59",
            deletedAt: null,
          },
          {
            id: 6,
            role_id: 1,
            service_id: 6,
            read: 1,
            write: 1,
            edit: 1,
            del: 1,
            createdAt: "2025-06-04 13:46:09",
            updatedAt: "2025-10-02 13:06:04",
            deletedAt: null,
          },
          {
            id: 5,
            role_id: 1,
            service_id: 5,
            read: 0,
            write: 1,
            edit: 1,
            del: 1,
            createdAt: "2025-06-04 13:45:44",
            updatedAt: "2025-09-10 13:56:30",
            deletedAt: "2025-09-24 13:21:03",
          },
          {
            id: 4,
            role_id: 1,
            service_id: 4,
            read: 1,
            write: 1,
            edit: 1,
            del: 1,
            createdAt: "2025-06-04 13:33:14",
            updatedAt: "2025-10-02 13:06:12",
            deletedAt: null,
          },
          {
            id: 3,
            role_id: 1,
            service_id: 3,
            read: 1,
            write: 1,
            edit: 1,
            del: 1,
            createdAt: "2025-06-04 13:33:14",
            updatedAt: "2025-10-02 13:04:40",
            deletedAt: null,
          },
          {
            id: 2,
            role_id: 1,
            service_id: 2,
            read: 1,
            write: 1,
            edit: 1,
            del: 1,
            createdAt: "2025-06-04 13:33:14",
            updatedAt: "2025-10-02 13:06:20",
            deletedAt: null,
          },
          {
            id: 26,
            role_id: 2,
            service_id: 7,
            read: 0,
            write: 0,
            edit: 0,
            del: 0,
            createdAt: "2025-09-24 13:21:58",
            updatedAt: "2025-10-02 13:05:59",
            deletedAt: null,
          },
          {
            id: 12,
            role_id: 2,
            service_id: 6,
            read: 1,
            write: 1,
            edit: 1,
            del: 1,
            createdAt: "2025-06-05 12:50:59",
            updatedAt: "2025-10-02 13:06:04",
            deletedAt: null,
          },
          {
            id: 11,
            role_id: 2,
            service_id: 5,
            read: 0,
            write: 0,
            edit: 0,
            del: 0,
            createdAt: "2025-06-05 12:50:59",
            updatedAt: "2025-09-10 13:56:30",
            deletedAt: "2025-09-24 13:21:03",
          },
          {
            id: 10,
            role_id: 2,
            service_id: 4,
            read: 0,
            write: 0,
            edit: 0,
            del: 0,
            createdAt: "2025-06-05 12:50:59",
            updatedAt: "2025-10-02 13:06:12",
            deletedAt: null,
          },
          {
            id: 9,
            role_id: 2,
            service_id: 3,
            read: 0,
            write: 0,
            edit: 0,
            del: 0,
            createdAt: "2025-06-05 12:50:59",
            updatedAt: "2025-10-02 13:04:40",
            deletedAt: null,
          },
          {
            id: 8,
            role_id: 2,
            service_id: 2,
            read: 0,
            write: 0,
            edit: 0,
            del: 0,
            createdAt: "2025-06-05 12:50:59",
            updatedAt: "2025-10-02 13:06:20",
            deletedAt: null,
          },
          {
            id: 7,
            role_id: 2,
            service_id: 1,
            read: 0,
            write: 0,
            edit: 0,
            del: 0,
            createdAt: "2025-06-05 12:50:59",
            updatedAt: "2025-10-02 13:06:26",
            deletedAt: null,
          },
          {
            id: 27,
            role_id: 3,
            service_id: 7,
            read: 0,
            write: 0,
            edit: 0,
            del: 0,
            createdAt: "2025-09-24 13:21:58",
            updatedAt: "2025-10-02 13:05:59",
            deletedAt: null,
          },
          {
            id: 18,
            role_id: 3,
            service_id: 6,
            read: 1,
            write: 1,
            edit: 1,
            del: 0,
            createdAt: "2025-06-05 12:51:10",
            updatedAt: "2025-10-02 13:06:04",
            deletedAt: null,
          },
          {
            id: 17,
            role_id: 3,
            service_id: 5,
            read: 0,
            write: 0,
            edit: 0,
            del: 0,
            createdAt: "2025-06-05 12:51:10",
            updatedAt: "2025-09-10 13:56:30",
            deletedAt: "2025-09-24 13:21:03",
          },
          {
            id: 16,
            role_id: 3,
            service_id: 4,
            read: 0,
            write: 0,
            edit: 0,
            del: 0,
            createdAt: "2025-06-05 12:51:10",
            updatedAt: "2025-10-02 13:06:12",
            deletedAt: null,
          },
          {
            id: 13,
            role_id: 3,
            service_id: 1,
            read: 0,
            write: 0,
            edit: 0,
            del: 0,
            createdAt: "2025-06-05 12:51:10",
            updatedAt: "2025-10-02 13:06:26",
            deletedAt: null,
          },
          {
            id: 14,
            role_id: 3,
            service_id: 2,
            read: 0,
            write: 0,
            edit: 0,
            del: 0,
            createdAt: "2025-06-05 12:51:10",
            updatedAt: "2025-10-02 13:06:20",
            deletedAt: null,
          },
          {
            id: 15,
            role_id: 3,
            service_id: 3,
            read: 0,
            write: 0,
            edit: 0,
            del: 0,
            createdAt: "2025-06-05 12:51:10",
            updatedAt: "2025-10-02 13:04:40",
            deletedAt: null,
          },
          {
            id: 24,
            role_id: 4,
            service_id: 6,
            read: 1,
            write: 1,
            edit: 0,
            del: 0,
            createdAt: "2025-06-05 12:51:18",
            updatedAt: "2025-10-02 13:06:04",
            deletedAt: null,
          },
          {
            id: 23,
            role_id: 4,
            service_id: 5,
            read: 0,
            write: 0,
            edit: 0,
            del: 0,
            createdAt: "2025-06-05 12:51:18",
            updatedAt: "2025-09-10 13:56:30",
            deletedAt: "2025-09-24 13:21:03",
          },
          {
            id: 22,
            role_id: 4,
            service_id: 4,
            read: 0,
            write: 0,
            edit: 0,
            del: 0,
            createdAt: "2025-06-05 12:51:18",
            updatedAt: "2025-10-02 13:06:12",
            deletedAt: null,
          },
          {
            id: 21,
            role_id: 4,
            service_id: 3,
            read: 0,
            write: 0,
            edit: 0,
            del: 0,
            createdAt: "2025-06-05 12:51:18",
            updatedAt: "2025-10-02 13:04:40",
            deletedAt: null,
          },
          {
            id: 20,
            role_id: 4,
            service_id: 2,
            read: 0,
            write: 0,
            edit: 0,
            del: 0,
            createdAt: "2025-06-05 12:51:18",
            updatedAt: "2025-10-02 13:06:20",
            deletedAt: null,
          },
          {
            id: 19,
            role_id: 4,
            service_id: 1,
            read: 0,
            write: 0,
            edit: 0,
            del: 0,
            createdAt: "2025-06-05 12:51:18",
            updatedAt: "2025-10-02 13:06:26",
            deletedAt: null,
          },
          {
            id: 28,
            role_id: 4,
            service_id: 7,
            read: 0,
            write: 0,
            edit: 0,
            del: 0,
            createdAt: "2025-09-24 13:21:58",
            updatedAt: "2025-10-02 13:05:59",
            deletedAt: null,
          },
        ],
      },
      {
        table: "service_visibilities",
        data: [
          { id: 1, setor_id: 1, service_id: 4, visibility: 1 },
          { id: 2, setor_id: 1, service_id: 1, visibility: 1 },
          { id: 3, setor_id: 1, service_id: 2, visibility: 1 },
          { id: 4, setor_id: 1, service_id: 3, visibility: 1 },
          { id: 6, setor_id: 1, service_id: 6, visibility: 1 },
          { id: 13, setor_id: 1, service_id: 7, visibility: 1 },
          { id: 11, setor_id: 2, service_id: 4, visibility: 0 },
          { id: 10, setor_id: 2, service_id: 6, visibility: 1 },
          { id: 9, setor_id: 2, service_id: 3, visibility: 0 },
          { id: 8, setor_id: 2, service_id: 2, visibility: 0 },
          { id: 7, setor_id: 2, service_id: 1, visibility: 0 },
          { id: 14, setor_id: 2, service_id: 7, visibility: 0 },
        ],
      },
    ];

    const validateTableData = async (data, table) => {
      const unique = [];

      for (const item of data) {
        const isUnique = await queryInterface.rawSelect(table, {
          where: { id: item.id },
        }, 'id');

        if (!isUnique) {
          unique.push(item);
        }
      }

      return unique;
    };

    const insertTable = async (table, data) => {
      const unique = await validateTableData(data, table);
      if (unique.length === 0) return;
      return await queryInterface.bulkInsert(table, unique);
    };

    for (const item of payload) {
      await insertTable(item.table, item.data);
    }
  },

  async down(queryInterface, Sequelize) {
    const reversedPayload = [
        { table: "service_visibilities", data: payload[2].data },
        { table: "permissions", data: payload[1].data },
        { table: "roles", data: payload[0].data },
    ];

    for (const item of reversedPayload) {
        const table = item.table;
        const idsToDelete = item.data.map(d => d.id);
        
        if (idsToDelete.length > 0) {
            console.log(`[Revert] Removendo registros da tabela: ${table}`);
            
            await queryInterface.bulkDelete(table, {
                id: {
                    [Sequelize.Op.in]: idsToDelete
                }
            }, {});
        } else {
            console.log(`[Revert] Nenhuma ID para remover da tabela: ${table}`);
        }
    }
  },
};
