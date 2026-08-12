import assert from "node:assert/strict";
import test from "node:test";
import { DataTypes, Sequelize } from "sequelize";
import { allocateProtocolNumber } from "../protocol-number.js";

const databaseUrl = process.env.PROTOCOL_DB_TEST_URL;

test("numeração concorrente não duplica valores no MariaDB", {
  skip: databaseUrl ? false : "PROTOCOL_DB_TEST_URL não configurada",
  timeout: 30_000,
}, async () => {
  const sequelize = new Sequelize(databaseUrl!, {
    dialect: "mariadb",
    logging: false,
    pool: { min: 0, max: 10 },
  });
  const counterModel = sequelize.define("ProtocolCounterIntegrationModel", {
    year: { type: DataTypes.INTEGER, primaryKey: true },
    value: { type: DataTypes.INTEGER, allowNull: false },
  }, { tableName: "protocol_counter_integration", timestamps: false });

  try {
    await counterModel.sync({ force: true });
    await counterModel.create({ year: 2026, value: 0 });

    const numbers = await Promise.all(Array.from({ length: 25 }, () =>
      sequelize.transaction((transaction) =>
        allocateProtocolNumber(counterModel as any, transaction, new Date(2026, 7, 11)),
      ),
    ));

    assert.equal(new Set(numbers).size, 25);
    assert.deepEqual([...numbers].sort(), Array.from({ length: 25 }, (_, index) =>
      `2026/${String(index + 1).padStart(6, "0")}`,
    ));
    const counter = await counterModel.findByPk(2026);
    assert.equal(counter?.get("value"), 25);
  } finally {
    await counterModel.drop().catch(() => undefined);
    await sequelize.close();
  }
});
