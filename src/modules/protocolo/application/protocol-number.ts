import { Transaction } from "sequelize";

type CounterModel = {
  sequelize: { query(sql: string, options: { replacements: { year: number }; transaction: Transaction }): Promise<unknown> };
  getTableName(): string | { tableName: string };
  findByPk(year: number, options: { transaction: Transaction; lock: unknown }): Promise<{ value: number } | null>;
};

/**
 * Allocates the next public protocol number while holding the annual counter row.
 * The caller must run this inside the same transaction used to create the protocol.
 */
export async function allocateProtocolNumber(
  counterModel: CounterModel,
  transaction: Transaction,
  now = new Date(),
): Promise<string> {
  const year = now.getFullYear();
  const table = counterModel.getTableName();
  const tableName = typeof table === "string" ? table : table.tableName;
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) throw new Error("Invalid protocol counter table name");
  await counterModel.sequelize.query(
    `INSERT INTO \`${tableName}\` (\`year\`, \`value\`) VALUES (:year, 1) ON DUPLICATE KEY UPDATE \`value\` = \`value\` + 1`,
    { replacements: { year }, transaction },
  );
  const counter = await counterModel.findByPk(year, { transaction, lock: transaction.LOCK.UPDATE });
  if (!counter) throw new Error("Protocol counter was not persisted");

  return `${year}/${String(counter.value).padStart(6, "0")}`;
}
