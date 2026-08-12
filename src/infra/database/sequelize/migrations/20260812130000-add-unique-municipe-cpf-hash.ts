import { QueryInterface, QueryTypes } from "sequelize";

const indexName = "uq_municipes_cpf_hash";

async function indexExists(queryInterface: QueryInterface): Promise<boolean> {
  const rows = await queryInterface.sequelize.query<{ present: number }>(
    "SELECT COUNT(*) AS present FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'municipes' AND INDEX_NAME = :indexName",
    { replacements: { indexName }, type: QueryTypes.SELECT },
  );
  return Number(rows[0]?.present || 0) > 0;
}

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (await indexExists(queryInterface)) return;
    const duplicates = await queryInterface.sequelize.query<{ cpfHash: string; total: number }>(
      "SELECT cpfHash, COUNT(*) AS total FROM municipes GROUP BY cpfHash HAVING COUNT(*) > 1 LIMIT 1",
      { type: QueryTypes.SELECT },
    );
    if (duplicates.length) {
      throw new Error(`Cannot create ${indexName}: duplicate cpfHash records must be reconciled first`);
    }
    await queryInterface.addIndex("municipes", ["cpfHash"], { name: indexName, unique: true });
  },
  down: async (queryInterface: QueryInterface): Promise<void> => {
    if (await indexExists(queryInterface)) {
      await queryInterface.sequelize.query(`DROP INDEX \`${indexName}\` ON \`municipes\``);
    }
  },
};
