import { QueryInterface } from "sequelize";

export type Row = Record<string, unknown>;
export function bootstrapFixture() {
  let data: Record<string, Row[]> = {
    roles: [],
    setors: [],
    services: [],
    users: [],
    permission_actions: [],
    role_permissions: [],
    service_visibilities: [],
    ft_estoque_controle: [],
  };
  let failTable: string | undefined;
  const transaction = {};
  const query = {
    sequelize: {
      transaction: async (work: (transaction: object) => Promise<void>) => {
        const before = structuredClone(data);
        try {
          await work(transaction);
        } catch (error) {
          data = before;
          throw error;
        }
      },
      query: async (
        sql: string,
        options: { transaction: object; replacements?: { id: number } },
      ) => {
        if (options.transaction !== transaction)
          throw new Error("Query escaped transaction");
        if (sql.includes("FROM roles WHERE id=1"))
          return data.roles.filter((row) => row.id === 1);
        if (sql.includes("FROM permission_actions"))
          return [...data.permission_actions];
        if (sql.includes("FROM services WHERE id=:id"))
          return data.services.filter(
            (row) => row.id === options.replacements?.id,
          );
        if (sql.includes("FROM services")) return [...data.services];
        if (sql.includes("FROM role_permissions WHERE role_id=1"))
          return data.role_permissions.filter((row) => row.role_id === 1);
        throw new Error("Unexpected bootstrap query");
      },
    },
    rawSelect: async (
      table: string,
      options: { where: Row; transaction: object },
      field: string,
    ) => {
      if (options.transaction !== transaction)
        throw new Error("Read escaped transaction");
      return (
        data[table].find((row) =>
          Object.entries(options.where).every(
            ([key, value]) => row[key] === value,
          ),
        )?.[field] ?? null
      );
    },
    bulkInsert: async (
      table: string,
      rows: Row[],
      options: { transaction: object },
    ) => {
      if (options.transaction !== transaction)
        throw new Error("Write escaped transaction");
      if (failTable === table) throw new Error("SYNTHETIC_INSERT_FAILURE");
      for (const row of rows)
        data[table].push({
          ...row,
          id:
            row.id ??
            Math.max(0, ...data[table].map((item) => Number(item.id))) + 1,
        });
    },
  } as unknown as QueryInterface;
  return {
    query,
    rows: (table: string) => data[table],
    snapshot: () => structuredClone(data),
    failOn: (table?: string) => {
      failTable = table;
    },
  };
}
