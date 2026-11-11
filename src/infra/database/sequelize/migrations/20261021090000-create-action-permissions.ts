import { DataTypes, QueryInterface } from "sequelize";
import {
  ASCII64,
  ensureForeignKeys,
  fillModuleKeys,
  permissionForeignKeys as foreignKeys,
  permissionTableNames,
  precheck,
  select,
} from "./helpers/action-permissions.js";

const id = {
  type: DataTypes.INTEGER,
  allowNull: false,
  primaryKey: true,
  autoIncrement: true,
};
const integer = { type: DataTypes.INTEGER, allowNull: false };
const date = { type: DataTypes.DATE, allowNull: false };
const definitions = {
  permission_actions: {
    id,
    service_id: integer,
    module_key: { type: ASCII64, allowNull: false },
    action: {
      type: "VARCHAR(96) CHARACTER SET ascii COLLATE ascii_bin",
      allowNull: false,
    },
    createdAt: date,
    updatedAt: date,
  },
  role_permissions: {
    id,
    role_id: integer,
    permission_action_id: integer,
    allowed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    createdAt: date,
    updatedAt: date,
  },
  permission_migration_state: {
    id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    completedAt: { type: DataTypes.DATE, allowNull: true },
  },
};
const indexDefinitions: [string, string, string[], boolean][] = [
  ["services", "uq_services_module_key", ["module_key"], true],
  ["services", "uq_services_id_module_key", ["id", "module_key"], true],
  [
    "permission_actions",
    "uq_permission_actions_service_action",
    ["service_id", "action"],
    true,
  ],
  [
    "permission_actions",
    "uq_permission_actions_module_action",
    ["module_key", "action"],
    true,
  ],
  [
    "permission_actions",
    "idx_permission_actions_service_module",
    ["service_id", "module_key"],
    false,
  ],
  [
    "role_permissions",
    "uq_role_permissions_role_action",
    ["role_id", "permission_action_id"],
    true,
  ],
  [
    "role_permissions",
    "idx_role_permissions_action",
    ["permission_action_id"],
    false,
  ],
];

interface Column {
  Field: string;
  Type: string;
  Null: string;
  Key: string;
  Default: unknown;
  Extra: string;
  Collation: string | null;
}
function assertColumn(
  table: string,
  column: Column,
  expectedType: string,
  nullable: boolean,
  primary = false,
  auto = false,
) {
  // MariaDB display widths are not semantic. Signedness and charset are semantic.
  const type = column.Type.toLowerCase().replace(/int\(\d+\)/g, "int");
  if (
    type !== expectedType ||
    (column.Null === "YES") !== nullable ||
    (column.Key === "PRI") !== primary ||
    column.Extra.includes("auto_increment") !== auto ||
    (expectedType.startsWith("varchar") && column.Collation !== "ascii_bin")
  ) {
    throw new Error(
      `Permission DDL definition mismatch: ${table}.${column.Field}`,
    );
  }
}
export async function verifyColumns(
  qi: QueryInterface,
  table: keyof typeof definitions,
) {
  const columns = await select<Column>(
    qi,
    `SHOW FULL COLUMNS FROM \`${table}\``,
  );
  for (const [field, definition] of Object.entries(definitions[table])) {
    const column = columns.find((c) => c.Field === field);
    if (!column)
      throw new Error(`Permission DDL definition mismatch: ${table}.${field}`);
    const expected =
      field === "module_key"
        ? "varchar(64)"
        : field === "action"
          ? "varchar(96)"
          : ["createdAt", "updatedAt", "completedAt"].includes(field)
            ? "datetime"
            : ["allowed", "completed"].includes(field)
              ? "tinyint"
              : "int";
    assertColumn(
      table,
      column,
      expected,
      definition.allowNull,
      field === "id",
      field === "id" && table !== "permission_migration_state",
    );
    if (
      ["allowed", "completed"].includes(field) &&
      !["0", 0, false].includes(column.Default as any)
    )
      throw new Error(`Permission DDL default mismatch: ${table}.${field}`);
  }
  if (columns.length !== Object.keys(definitions[table]).length)
    throw new Error(`Permission DDL unexpected columns: ${table}`);
}
async function ensureIndexes(qi: QueryInterface) {
  for (const [table, name, fields, unique] of indexDefinitions) {
    const indexes = (await qi.showIndex(table)) as any[];
    const existing = indexes.find((i) => i.name === name);
    if (!existing) await qi.addIndex(table, fields, { name, unique });
    else if (
      Boolean(existing.unique) !== unique ||
      JSON.stringify(existing.fields.map((f: any) => f.attribute)) !==
        JSON.stringify(fields) ||
      existing.fields.some((f: any) => f.length != null)
    )
      throw new Error(`Permission DDL index mismatch: ${table}.${name}`);
  }
}
export default {
  async up(qi: QueryInterface) {
    await precheck(qi);
    // MariaDB DDL implicitly commits. Every object is resumed and verified separately.
    const serviceColumns = await qi.describeTable("services");
    for (const table of ["services", "roles"]) {
      const [pk] = (
        await select<Column>(qi, `SHOW FULL COLUMNS FROM \`${table}\``)
      ).filter((c) => c.Field === "id");
      assertColumn(table, pk, "int", false, true, true);
    }
    if (serviceColumns.module_key) {
      const [existing] = (
        await select<Column>(qi, "SHOW FULL COLUMNS FROM services")
      ).filter((c) => c.Field === "module_key");
      assertColumn(
        "services",
        existing,
        "varchar(64)",
        existing.Null === "YES",
      );
    }
    const present = await permissionTableNames(qi);
    for (const table of Object.keys(
      definitions,
    ) as (keyof typeof definitions)[])
      if (present.includes(table)) await verifyColumns(qi, table);
    if (!serviceColumns.module_key)
      await qi.addColumn("services", "module_key", {
        type: ASCII64,
        allowNull: true,
      });
    const [column] = (
      await select<Column>(qi, "SHOW FULL COLUMNS FROM services")
    ).filter((c) => c.Field === "module_key");
    assertColumn("services", column, "varchar(64)", column.Null === "YES");
    for (const table of Object.keys(
      definitions,
    ) as (keyof typeof definitions)[]) {
      if (!(await permissionTableNames(qi)).includes(table))
        await qi.createTable(table, definitions[table]);
      await verifyColumns(qi, table);
    }
    const services = await fillModuleKeys(qi);
    if (services.length && column.Null === "YES")
      await qi.changeColumn("services", "module_key", {
        type: ASCII64,
        allowNull: false,
      });
    await ensureIndexes(qi);
    await ensureForeignKeys(qi, services.length === 0 && column.Null === "YES");
    const states = await select<{ id: number }>(
      qi,
      "SELECT id FROM permission_migration_state",
    );
    if (states.some((s) => s.id !== 1))
      throw new Error("permission_migration_state: invalid singleton");
    if (!states.length)
      await qi.bulkInsert("permission_migration_state", [
        { id: 1, completed: false, completedAt: null },
      ]);
    // Only clean bootstrap defers NOT NULL and the composite service FK to the
    // final seed: historical seeds still insert services without module_key.
  },
  async down(qi: QueryInterface) {
    const tables = await permissionTableNames(qi);
    for (const table of ["role_permissions", "permission_actions"])
      if (tables.includes(table)) {
        const [row] = await select<{ count: number }>(
          qi,
          `SELECT COUNT(*) count FROM \`${table}\``,
        );
        if (Number(row.count))
          throw new Error(`Unsafe structural rollback: ${table} not empty`);
      }
    if (tables.includes("permission_migration_state")) {
      const rows = await select<{ completed: unknown }>(
        qi,
        "SELECT completed FROM permission_migration_state",
      );
      if (rows.some((r) => r.completed === true || r.completed === 1))
        throw new Error("Unsafe structural rollback: snapshot completed");
    }
    // Check dependencies before the first DROP, including future external FKs.
    const dependencies = await select<{
      table_name: string;
      referenced_table_name: string;
      constraint_name: string;
    }>(
      qi,
      "SELECT TABLE_NAME table_name,REFERENCED_TABLE_NAME referenced_table_name,CONSTRAINT_NAME constraint_name FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA=DATABASE() AND (REFERENCED_TABLE_NAME IN ('permission_actions','role_permissions','permission_migration_state') OR (REFERENCED_TABLE_NAME='services' AND REFERENCED_COLUMN_NAME='module_key'))",
    );
    if (
      dependencies.some(
        (d) =>
          !foreignKeys.some(
            ([table, name]) =>
              d.table_name === table && d.constraint_name === name,
          ),
      )
    )
      throw new Error("Unsafe structural rollback: new dependencies");
    for (const table of [
      "role_permissions",
      "permission_actions",
      "permission_migration_state",
    ])
      if (tables.includes(table)) await qi.dropTable(table);
    if ((await qi.describeTable("services")).module_key) {
      const indexes = (await qi.showIndex("services")) as any[];
      for (const name of [
        "uq_services_id_module_key",
        "uq_services_module_key",
      ])
        if (indexes.some((i) => i.name === name))
          await qi.removeIndex("services", name);
      await qi.removeColumn("services", "module_key");
    }
  },
};
