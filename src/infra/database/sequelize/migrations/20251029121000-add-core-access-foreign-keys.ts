import { QueryInterface, QueryTypes, Transaction } from "sequelize";

type OrphanCheck = { name: string; query: string };

const checks: OrphanCheck[] = [
  {
    name: "users.setor_id -> setors.id",
    query: "SELECT u.id FROM users u LEFT JOIN setors s ON s.id = u.setor_id WHERE u.setor_id IS NOT NULL AND s.id IS NULL LIMIT 1",
  },
  {
    name: "users.role_id -> roles.id",
    query: "SELECT u.id FROM users u LEFT JOIN roles r ON r.id = u.role_id WHERE r.id IS NULL LIMIT 1",
  },
  {
    name: "permissions.service_id -> services.id",
    query: "SELECT p.id FROM permissions p LEFT JOIN services s ON s.id = p.service_id WHERE s.id IS NULL LIMIT 1",
  },
  {
    name: "service_visibilities.setor_id -> setors.id",
    query: "SELECT v.id FROM service_visibilities v LEFT JOIN setors s ON s.id = v.setor_id WHERE s.id IS NULL LIMIT 1",
  },
  {
    name: "service_visibilities.service_id -> services.id",
    query: "SELECT v.id FROM service_visibilities v LEFT JOIN services s ON s.id = v.service_id WHERE s.id IS NULL LIMIT 1",
  },
];

const assertNoOrphans = async (
  queryInterface: QueryInterface,
  transaction: Transaction,
) => {
  for (const check of checks) {
    const rows = await queryInterface.sequelize.query(check.query, {
      type: QueryTypes.SELECT,
      transaction,
    });

    if (rows.length > 0) {
      throw new Error(
        `Cannot add foreign key ${check.name}: orphaned record ${JSON.stringify(rows[0])}`,
      );
    }
  }
};

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await assertNoOrphans(queryInterface, transaction);

      await queryInterface.addConstraint("users", {
        fields: ["setor_id"],
        type: "foreign key",
        name: "fk_users_setor_id",
        references: { table: "setors", field: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        transaction,
      });
      await queryInterface.addConstraint("users", {
        fields: ["role_id"],
        type: "foreign key",
        name: "fk_users_role_id",
        references: { table: "roles", field: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
        transaction,
      });
      await queryInterface.addConstraint("permissions", {
        fields: ["service_id"],
        type: "foreign key",
        name: "fk_permissions_service_id",
        references: { table: "services", field: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
        transaction,
      });
      await queryInterface.addConstraint("service_visibilities", {
        fields: ["setor_id"],
        type: "foreign key",
        name: "fk_service_visibilities_setor_id",
        references: { table: "setors", field: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
        transaction,
      });
      await queryInterface.addConstraint("service_visibilities", {
        fields: ["service_id"],
        type: "foreign key",
        name: "fk_service_visibilities_service_id",
        references: { table: "services", field: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
        transaction,
      });
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint("service_visibilities", "fk_service_visibilities_service_id", { transaction });
      await queryInterface.removeConstraint("service_visibilities", "fk_service_visibilities_setor_id", { transaction });
      await queryInterface.removeConstraint("permissions", "fk_permissions_service_id", { transaction });
      await queryInterface.removeConstraint("users", "fk_users_role_id", { transaction });
      await queryInterface.removeConstraint("users", "fk_users_setor_id", { transaction });
    });
  },
};
