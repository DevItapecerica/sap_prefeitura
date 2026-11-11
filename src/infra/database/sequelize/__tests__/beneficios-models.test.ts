import assert from "node:assert/strict";
import test from "node:test";
import { DataTypes as D, Sequelize } from "sequelize";
import type { DbObject } from "../../../../core/types/DbTypes.js";
import entrega from "../models/ft-beneficio-entrega.model.js";
import item from "../models/ft-beneficio-entrega-item.model.js";
import retirada from "../models/ft-beneficio-retirada.model.js";
import operacao from "../models/ft-beneficio-operacao.model.js";

test("benefit ORM models preserve existing columns, composite keys, indexes and restrictive relationships", async () => {
  const sequelize = new Sequelize("database", "username", "password", {
    dialect: "mariadb",
    logging: false,
  });
  try {
    const models: DbObject = { sequelize };
    for (const [name, key] of [
      ["Edital", "id"],
      ["BolsistasEdital", "id"],
      ["MunicipeModel", "uuid"],
      ["FtEditalBeneficio", "id"],
    ])
      models[name] = sequelize.define(
        name,
        { [key]: { type: D.UUID, primaryKey: true } },
        { timestamps: false },
      );
    const created = [
      entrega(sequelize),
      item(sequelize),
      retirada(sequelize),
      operacao(sequelize),
    ];
    for (const model of created) models[model.name] = model;
    for (const model of created) model.associate(models);
    const [delivery, items, coverage, operation] = created;
    assert.equal(delivery.getTableName(), "ft_beneficio_entregas");
    assert.deepEqual(items.primaryKeyAttributes, [
      "entrega_id",
      "beneficio_id",
    ]);
    assert.deepEqual(coverage.primaryKeyAttributes, [
      "edital_id",
      "pessoa_id",
      "beneficio_id",
      "mes",
    ]);
    assert.deepEqual(operation.primaryKeyAttributes, ["id"]);
    for (const model of created) {
      assert.equal(model.options.timestamps, false);
      assert.equal(model.options.paranoid, false);
      assert.ok(!model.rawAttributes.createdAt);
      assert.ok(!model.rawAttributes.updatedAt);
    }
    assert.ok(!items.rawAttributes.id);
    assert.ok(!coverage.rawAttributes.id);
    for (const key of ["edital_id", "participacao_id", "pessoa_id"]) {
      assert.equal(delivery.rawAttributes[key].allowNull, false);
      assert.equal(delivery.rawAttributes[key].onDelete, "RESTRICT");
      assert.equal(delivery.rawAttributes[key].onUpdate, "RESTRICT");
    }
    assert.equal(delivery.rawAttributes.estornado_em.allowNull, true);
    assert.equal(items.rawAttributes.descricao.allowNull, true);
    assert.equal(String(operation.rawAttributes.resultado.type), "LONGTEXT");
    assert.equal(delivery.associations.itens.target, items);
    assert.equal(delivery.associations.pessoa.target, models.MunicipeModel);
    assert.equal(coverage.associations.entrega.target, delivery);
    assert.deepEqual(
      delivery.options.indexes?.map((index) => index.name),
      ["idx_ft_beneficios_mes", "idx_ft_beneficios_participacao"],
    );
  } finally {
    await sequelize.close();
  }
});
