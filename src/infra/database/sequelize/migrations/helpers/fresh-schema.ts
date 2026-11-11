import { QueryInterface, QueryTypes } from "sequelize";

export async function assertNewDatabase(query: QueryInterface): Promise<void> {
  const tables = await query.showAllTables();
  const names = tables.map((entry: unknown) => {
    if (typeof entry === "string") return entry;
    if (
      entry &&
      typeof entry === "object" &&
      "tableName" in entry &&
      typeof entry.tableName === "string"
    )
      return entry.tableName;
    throw new Error("Unsupported database table descriptor");
  });
  const existing = names.filter(
    (name) => !["sequelizemeta", "sequelizedata"].includes(name.toLowerCase()),
  );
  if (existing.length)
    throw new Error(
      "Fresh installation requires an empty database. Use a new database; existing tables and data were not changed.",
    );
  for (const metadata of names) {
    const [row] = await query.sequelize.query<{ count: number }>(
      `SELECT COUNT(*) AS count FROM \`${metadata}\``,
      { type: QueryTypes.SELECT },
    );
    if (Number(row.count))
      throw new Error(
        "Fresh installation requires an empty migration/seed history. Use a new database; history was not changed.",
      );
  }
}

export async function assertEmptyTables(
  query: QueryInterface,
  tables: string[],
): Promise<void> {
  for (const table of tables) {
    // Names are schema constants, never request input.
    if (!/^[a-z_]+$/.test(table)) throw new Error("Invalid schema table name");
    const [row] = await query.sequelize.query<{ count: number }>(
      `SELECT COUNT(*) AS count FROM \`${table}\``,
      { type: QueryTypes.SELECT },
    );
    if (Number(row.count))
      throw new Error(
        "Rollback refused: preserve records in " +
          table +
          "; use a forward fix.",
      );
  }
}
