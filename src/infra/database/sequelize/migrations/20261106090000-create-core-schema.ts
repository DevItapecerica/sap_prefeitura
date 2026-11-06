import { QueryInterface, literal } from "sequelize";
import {
  assertNewDatabase,
  assertEmptyTables,
} from "./helpers/fresh-schema.js";

export const tables = [
  "roles",
  "setors",
  "services",
  "users",
  "user_sessions",
  "service_visibilities",
  "permission_actions",
  "role_permissions",
];

export default {
  async up(query: QueryInterface): Promise<void> {
    await assertNewDatabase(query);
    await query.createTable(
      "roles",
      {
        id: {
          type: "INT(11)",
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        name: { type: "VARCHAR(255)", allowNull: false },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.createTable(
      "setors",
      {
        id: {
          type: "INT(11)",
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        name: { type: "VARCHAR(255)", allowNull: false },
        description: { type: "VARCHAR(255)", allowNull: true },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.createTable(
      "services",
      {
        id: {
          type: "INT(11)",
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        name: { type: "VARCHAR(255)", allowNull: false },
        description: { type: "VARCHAR(255)", allowNull: true },
        tag: { type: "VARCHAR(15)", allowNull: false, defaultValue: "outros" },
        url: { type: "VARCHAR(255)", allowNull: false },
        createdAt: { type: "DATETIME", allowNull: false },
        updatedAt: { type: "DATETIME", allowNull: false },
        deletedAt: { type: "DATETIME", allowNull: true },
        module_key: {
          type: "VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin",
          allowNull: false,
        },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("services", ["module_key"], {
      name: "uq_services_module_key",
      unique: true,
    });
    await query.addIndex("services", ["id", "module_key"], {
      name: "uq_services_id_module_key",
      unique: true,
    });
    await query.createTable(
      "users",
      {
        id: {
          type: "INT(11)",
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        name: { type: "VARCHAR(70)", allowNull: false },
        email: { type: "VARCHAR(255)", allowNull: false },
        ramal: { type: "VARCHAR(255)", allowNull: true },
        password: { type: "VARCHAR(255)", allowNull: false },
        setor_id: { type: "INT(11)", allowNull: true },
        role_id: { type: "INT(11)", allowNull: false },
        firstLogin: { type: "TINYINT(1)", allowNull: false, defaultValue: 1 },
        createdAt: {
          type: "DATETIME",
          allowNull: false,
          defaultValue: literal("CURRENT_TIMESTAMP"),
        },
        updatedAt: {
          type: "DATETIME",
          allowNull: false,
          defaultValue: literal("CURRENT_TIMESTAMP"),
        },
        deletedAt: { type: "DATETIME", allowNull: true },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("users", ["setor_id"], {
      name: "fk_users_setor_id",
      unique: false,
    });
    await query.addIndex("users", ["role_id"], {
      name: "fk_users_role_id",
      unique: false,
    });
    await query.addIndex("users", ["email"], {
      name: "idx_users_email",
      unique: false,
    });
    await query.createTable(
      "user_sessions",
      {
        id: {
          type: "INT(11)",
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        user_id: { type: "INT(11)", allowNull: false },
        refresh_token_hash: { type: "VARCHAR(64)", allowNull: false },
        expires_at: { type: "DATETIME", allowNull: false },
        revoked_at: { type: "DATETIME", allowNull: true },
        created_at: { type: "DATETIME", allowNull: false },
        updated_at: { type: "DATETIME", allowNull: false },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("user_sessions", ["refresh_token_hash"], {
      name: "refresh_token_hash",
      unique: true,
    });
    await query.addIndex("user_sessions", ["user_id"], {
      name: "idx_user_sessions_user_id",
      unique: false,
    });
    await query.createTable(
      "service_visibilities",
      {
        id: {
          type: "INT(11)",
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        setor_id: { type: "INT(11)", allowNull: false },
        service_id: { type: "INT(11)", allowNull: false },
        visibility: { type: "TINYINT(1)", allowNull: true, defaultValue: 0 },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("service_visibilities", ["setor_id"], {
      name: "fk_service_visibilities_setor_id",
      unique: false,
    });
    await query.addIndex("service_visibilities", ["service_id"], {
      name: "fk_service_visibilities_service_id",
      unique: false,
    });
    await query.addIndex("service_visibilities", ["setor_id", "service_id"], {
      name: "uq_service_visibilities_setor_service",
      unique: true,
    });
    await query.createTable(
      "permission_actions",
      {
        id: {
          type: "INT(11)",
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        service_id: { type: "INT(11)", allowNull: false },
        module_key: {
          type: "VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin",
          allowNull: false,
        },
        action: {
          type: "VARCHAR(96) CHARACTER SET ascii COLLATE ascii_bin",
          allowNull: false,
        },
        createdAt: { type: "DATETIME", allowNull: false },
        updatedAt: { type: "DATETIME", allowNull: false },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex("permission_actions", ["service_id", "action"], {
      name: "uq_permission_actions_service_action",
      unique: true,
    });
    await query.addIndex("permission_actions", ["module_key", "action"], {
      name: "uq_permission_actions_module_action",
      unique: true,
    });
    await query.addIndex("permission_actions", ["service_id", "module_key"], {
      name: "idx_permission_actions_service_module",
      unique: false,
    });
    await query.createTable(
      "role_permissions",
      {
        id: {
          type: "INT(11)",
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        role_id: { type: "INT(11)", allowNull: false },
        permission_action_id: { type: "INT(11)", allowNull: false },
        allowed: { type: "TINYINT(1)", allowNull: false, defaultValue: 0 },
        createdAt: { type: "DATETIME", allowNull: false },
        updatedAt: { type: "DATETIME", allowNull: false },
      },
      { engine: "InnoDB", charset: "utf8mb4", collate: "utf8mb4_general_ci" },
    );
    await query.addIndex(
      "role_permissions",
      ["role_id", "permission_action_id"],
      { name: "uq_role_permissions_role_action", unique: true },
    );
    await query.addIndex("role_permissions", ["permission_action_id"], {
      name: "idx_role_permissions_action",
      unique: false,
    });
    await query.addConstraint("users", {
      fields: ["role_id"],
      type: "foreign key",
      name: "fk_users_role_id",
      references: { table: "roles", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("users", {
      fields: ["setor_id"],
      type: "foreign key",
      name: "fk_users_setor_id",
      references: { table: "setors", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
    await query.addConstraint("user_sessions", {
      fields: ["user_id"],
      type: "foreign key",
      name: "user_sessions_ibfk_1",
      references: { table: "users", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await query.addConstraint("service_visibilities", {
      fields: ["service_id"],
      type: "foreign key",
      name: "fk_service_visibilities_service_id",
      references: { table: "services", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("service_visibilities", {
      fields: ["setor_id"],
      type: "foreign key",
      name: "fk_service_visibilities_setor_id",
      references: { table: "setors", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
    // Sequelize 6's public addConstraint type does not support composite references.
    await query.sequelize.query(
      "ALTER TABLE `permission_actions` ADD CONSTRAINT `fk_permission_actions_service_module` FOREIGN KEY (`service_id`, `module_key`) REFERENCES `services` (`id`, `module_key`) ON UPDATE CASCADE ON DELETE RESTRICT",
    );
    await query.addConstraint("role_permissions", {
      fields: ["permission_action_id"],
      type: "foreign key",
      name: "fk_role_permissions_action",
      references: { table: "permission_actions", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
    await query.addConstraint("role_permissions", {
      fields: ["role_id"],
      type: "foreign key",
      name: "fk_role_permissions_role",
      references: { table: "roles", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
  },
  async down(query: QueryInterface): Promise<void> {
    await assertEmptyTables(query, [
      "roles",
      "setors",
      "services",
      "users",
      "user_sessions",
      "service_visibilities",
      "permission_actions",
      "role_permissions",
    ]);
    await query.dropTable("role_permissions");
    await query.dropTable("permission_actions");
    await query.dropTable("service_visibilities");
    await query.dropTable("user_sessions");
    await query.dropTable("users");
    await query.dropTable("services");
    await query.dropTable("setors");
    await query.dropTable("roles");
  },
};
