import { QueryInterface, QueryTypes } from "sequelize";

const TABLE = "bolsistas_edital";
const PAIR_INDEX = "idx_bolsistas_edital_bolsista_edital";

type IndexRow = {
  Key_name: string;
  Column_name: string;
  Seq_in_index: number;
  Non_unique: number;
};

const getIndexes = async (queryInterface: QueryInterface) =>
  (await queryInterface.sequelize.query(`SHOW INDEX FROM \`${TABLE}\``, {
    type: QueryTypes.SELECT,
  })) as IndexRow[];

const sameColumns = (actual: string[], expected: string[]) =>
  actual.length === expected.length &&
  actual.every((column, index) => column === expected[index]);

const isBolsistaEditalPair = (columns: string[]) =>
  sameColumns(columns, ["bolsista_id", "edital_id"]) ||
  sameColumns(columns, ["edital_id", "bolsista_id"]);

const getGroupedIndexes = async (queryInterface: QueryInterface) => {
  const indexes = await getIndexes(queryInterface);
  const grouped = new Map<string, { nonUnique: number; columns: string[] }>();

  for (const index of indexes) {
    const current = grouped.get(index.Key_name) || {
      nonUnique: Number(index.Non_unique),
      columns: [],
    };

    current.columns[Number(index.Seq_in_index) - 1] = index.Column_name;
    grouped.set(index.Key_name, current);
  }

  return grouped;
};

const removePairUniqueIndexes = async (queryInterface: QueryInterface) => {
  const grouped = await getGroupedIndexes(queryInterface);

  for (const [name, index] of grouped) {
    if (
      name !== "PRIMARY" &&
      index.nonUnique === 0 &&
      isBolsistaEditalPair(index.columns)
    ) {
      await queryInterface.removeIndex(TABLE, name);
    }
  }
};

const ensurePairIndex = async (queryInterface: QueryInterface) => {
  const grouped = await getGroupedIndexes(queryInterface);
  const hasPairIndex = [...grouped.values()].some(
    (index) => index.nonUnique === 1 && isBolsistaEditalPair(index.columns),
  );

  if (!hasPairIndex) {
    await queryInterface.addIndex(TABLE, ["bolsista_id", "edital_id"], {
      name: PAIR_INDEX,
    });
  }
};

/** @type {import("sequelize-cli").Migration} */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await ensurePairIndex(queryInterface);
    await removePairUniqueIndexes(queryInterface);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeIndex(TABLE, PAIR_INDEX).catch(() => undefined);

    await queryInterface.addIndex(TABLE, ["bolsista_id", "edital_id"], {
      name: "unique_bolsistas_edital_bolsista_edital",
      unique: true,
    });
  },
};
