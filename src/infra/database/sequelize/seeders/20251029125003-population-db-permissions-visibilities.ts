import { Op, QueryInterface } from "sequelize";

type SeedRecord = Record<string, unknown> & { id: number };

type SeedPayload = {
  table: string;
  data: SeedRecord[];
};

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const payload: SeedPayload[] = [
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
          { id: 5, setor_id: 1, service_id: 5, visibility: 1 },
          { id: 6, setor_id: 1, service_id: 6, visibility: 1 },
          { id: 13, setor_id: 1, service_id: 7, visibility: 1 },
        ],
      },
    ];

    const validateTableData = async (
      data: SeedRecord[],
      table: string,
    ): Promise<SeedRecord[]> => {
      const unique: SeedRecord[] = [];

      for (const item of data) {
        const isUnique = await queryInterface.rawSelect(
          table,
          {
            where: { id: item.id },
          },
          "id",
        );

        if (!isUnique) {
          unique.push(item);
        }
      }

      return unique;
    };

    const insertTable = async (
      table: string,
      data: SeedRecord[],
    ): Promise<void> => {
      const unique = await validateTableData(data, table);
      if (unique.length === 0) return;
      await queryInterface.bulkInsert(table, unique);
    };

    for (const item of payload) {
      await insertTable(item.table, item.data);
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const reversedPayload = [
        { table: "service_visibilities", data: [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 13, 14, 16] },
        { table: "permissions", data: Array.from({ length: 28 }, (_, index) => index + 1) },
        { table: "roles", data: [1, 2, 3, 4] },
    ];

    for (const item of reversedPayload) {
        const table = item.table;
        const idsToDelete = item.data;
        
        if (idsToDelete.length > 0) {
            await queryInterface.bulkDelete(table, {
                id: {
                    [Op.in]: idsToDelete
                }
            }, {});
        }
    }
  },
};
