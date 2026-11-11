import { QueryInterface, QueryTypes, Transaction } from "sequelize";

type ResourceConstraint = {
  table: string;
  constraint: string;
};

const resources: ResourceConstraint[] = [
  {
    table: "esporte_atletas",
    constraint: "fk_esporte_atletas_municipe_uuid",
  },
  {
    table: "carterinhas",
    constraint: "fk_carterinhas_municipe_uuid",
  },
  {
    table: "carterinhas_esporte",
    constraint: "fk_carterinhas_esporte_municipe_uuid",
  },
];

const assertNoOrphans = async (
  queryInterface: QueryInterface,
  transaction: Transaction,
): Promise<void> => {
  for (const resource of resources) {
    const rows = await queryInterface.sequelize.query(
      `SELECT resource.uuid FROM ${resource.table} resource LEFT JOIN municipes municipe ON municipe.uuid = resource.municipe_uuid WHERE municipe.uuid IS NULL LIMIT 1`,
      { type: QueryTypes.SELECT, transaction },
    );

    if (rows.length > 0) {
      throw new Error(
        `Cannot add foreign key ${resource.table}.municipe_uuid -> municipes.uuid: orphaned record ${JSON.stringify(rows[0])}`,
      );
    }
  }
};

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await assertNoOrphans(queryInterface, transaction);

      for (const resource of resources) {
        await queryInterface.addConstraint(resource.table, {
          fields: ["municipe_uuid"],
          type: "foreign key",
          name: resource.constraint,
          references: { table: "municipes", field: "uuid" },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
          transaction,
        });
      }
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const resource of [...resources].reverse()) {
        await queryInterface.removeConstraint(resource.table, resource.constraint, {
          transaction,
        });
      }
    });
  },
};
