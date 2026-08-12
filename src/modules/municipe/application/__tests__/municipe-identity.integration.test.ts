import assert from "node:assert/strict";
import test from "node:test";
import { createHash, randomUUID } from "node:crypto";
import { QueryTypes, Sequelize } from "sequelize";

const databaseUrl = process.env.PROTOCOL_DB_TEST_URL;

test("MariaDB aceita apenas um municipe por CPF em inclusoes concorrentes", {
  skip: databaseUrl ? false : "PROTOCOL_DB_TEST_URL nao configurada",
  timeout: 30_000,
}, async () => {
  const sequelize = new Sequelize(databaseUrl!, { dialect: "mariadb", logging: false, pool: { min: 0, max: 4 } });
  const cpfHash = createHash("sha256").update(randomUUID()).digest("hex");
  const cepHash = createHash("sha256").update(`cep-${randomUUID()}`).digest("hex");
  const insert = (uuid: string) => sequelize.query(
    "INSERT INTO municipes (uuid, nome, cpf, nascimento, telefone, rua, bairro, cidade, uf, cep, numero, complemento, author, cpfHash, cepHash, createdAt, updatedAt) VALUES (:uuid, 'Concorrente', 'encrypted', 'encrypted', NULL, 'encrypted', 'encrypted', 'encrypted', 'encrypted', 'encrypted', 'encrypted', NULL, 'integration-test', :cpfHash, :cepHash, NOW(), NOW())",
    { replacements: { uuid, cpfHash, cepHash }, type: QueryTypes.INSERT },
  );

  try {
    const results = await Promise.allSettled([insert(randomUUID()), insert(randomUUID())]);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(results.filter((result) => result.status === "rejected").length, 1);
    const rows = await sequelize.query<{ total: number }>(
      "SELECT COUNT(*) AS total FROM municipes WHERE cpfHash = :cpfHash",
      { replacements: { cpfHash }, type: QueryTypes.SELECT },
    );
    assert.equal(Number(rows[0]?.total), 1);
  } finally {
    await sequelize.query("DELETE FROM municipes WHERE cpfHash = :cpfHash", { replacements: { cpfHash } }).catch(() => undefined);
    await sequelize.close();
  }
});
