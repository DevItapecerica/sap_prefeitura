import { QueryInterface, QueryTypes, Transaction } from "sequelize";
import {
  MODULE_SERVICE_IDS,
  PERMISSION_CATALOG,
  type LegacyFlag,
} from "../../../../../modules/acess-controll/domain/permission-catalog.js";

export const ASCII64 = "VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin";
export async function permissionTableNames(
  qi: QueryInterface,
): Promise<string[]> {
  const tables: unknown[] = await qi.showAllTables();
  return tables.map((table) => {
    if (typeof table === "string") return table;
    if (
      table !== null &&
      typeof table === "object" &&
      "tableName" in table &&
      typeof table.tableName === "string"
    )
      return table.tableName;
    throw new Error("Permission DDL: unsupported table descriptor");
  });
}

export const permissionForeignKeys: [
  string,
  string,
  string[],
  string,
  string[],
][] = [
  [
    "permission_actions",
    "fk_permission_actions_service_module",
    ["service_id", "module_key"],
    "services",
    ["id", "module_key"],
  ],
  [
    "role_permissions",
    "fk_role_permissions_role",
    ["role_id"],
    "roles",
    ["id"],
  ],
  [
    "role_permissions",
    "fk_role_permissions_action",
    ["permission_action_id"],
    "permission_actions",
    ["id"],
  ],
];
export async function ensureForeignKeys(
  qi: QueryInterface,
  deferServiceModule = false,
) {
  for (const [
    table,
    name,
    fields,
    target,
    targetFields,
  ] of permissionForeignKeys) {
    const rows = await qi.sequelize.query<{
      column_name: string;
      referenced_table_name: string;
      referenced_column_name: string;
      update_rule: string;
      delete_rule: string;
    }>(
      `SELECT k.COLUMN_NAME column_name,k.REFERENCED_TABLE_NAME referenced_table_name,k.REFERENCED_COLUMN_NAME referenced_column_name,r.UPDATE_RULE update_rule,r.DELETE_RULE delete_rule FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.REFERENTIAL_CONSTRAINTS r ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND r.TABLE_NAME=k.TABLE_NAME AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME WHERE k.CONSTRAINT_SCHEMA=DATABASE() AND k.TABLE_NAME=:table AND k.CONSTRAINT_NAME=:name ORDER BY k.ORDINAL_POSITION`,
      { replacements: { table, name }, type: QueryTypes.SELECT },
    );
    if (!rows.length) {
      // MariaDB cannot CASCADE a composite reference to nullable module_key.
      // Defer only this FK during clean bootstrap; never weaken its final rules.
      if (deferServiceModule && name === "fk_permission_actions_service_module")
        continue;
      await qi.addConstraint(table, {
        fields,
        type: "foreign key",
        name,
        references: { table: target, fields: targetFields } as unknown as {
          table: string;
          field: string;
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    } else if (
      JSON.stringify(rows.map((r) => r.column_name)) !==
        JSON.stringify(fields) ||
      JSON.stringify(rows.map((r) => r.referenced_column_name)) !==
        JSON.stringify(targetFields) ||
      rows.some(
        (r) =>
          r.referenced_table_name !== target ||
          r.update_rule !== "CASCADE" ||
          r.delete_rule !== "RESTRICT",
      )
    )
      throw new Error(`Permission DDL FK mismatch: ${table}.${name}`);
  }
}
export interface ServiceRow {
  id: number;
  module_key: string | null;
}
export interface ActionRow {
  id?: number;
  service_id: number;
  module_key: string;
  action: string;
  legacyFlag: LegacyFlag | null;
}
export interface LegacyRow {
  role_id: number;
  service_id: number;
  read: unknown;
  write: unknown;
  edit: unknown;
  del: unknown;
  deletedAt: unknown;
}
export const strictTrue = (value: unknown): boolean =>
  value === true || value === 1;
export const moduleForService = (id: number): string =>
  Object.entries(MODULE_SERVICE_IDS).find(
    ([, serviceId]) => serviceId === id,
  )?.[0] ?? `legado_${id}`;
export function catalogForServices(services: ServiceRow[]): ActionRow[] {
  return services.flatMap<ActionRow>((service) => {
    const module = moduleForService(service.id);
    if (service.module_key !== module)
      throw new Error("services.module_key definition mismatch");
    const entries = PERMISSION_CATALOG.filter(
      (p) => p.serviceId === service.id,
    );
    return entries.length
      ? entries.map((p) => ({
          service_id: service.id,
          module_key: module,
          action: p.action,
          legacyFlag: p.legacyFlag,
        }))
      : [
          {
            service_id: service.id,
            module_key: module,
            action: "acessar",
            legacyFlag: "read",
          },
        ];
  });
}
export function buildSnapshot(
  roles: number[],
  actions: ActionRow[],
  legacy: LegacyRow[],
) {
  const active = new Map<string, LegacyRow>();
  for (const row of legacy.filter((p) => p.deletedAt == null)) {
    const key = `${row.role_id}:${row.service_id}`;
    if (active.has(key))
      throw new Error("permissions: duplicate active role/service");
    if (
      ["read", "write", "edit", "del"].some(
        (flag) => ![0, 1, true, false].includes(row[flag as LegacyFlag] as any),
      )
    )
      throw new Error("permissions: invalid flags");
    if (
      !strictTrue(row.read) &&
      [row.write, row.edit, row.del].some(strictTrue)
    )
      throw new Error("permissions: write without read");
    active.set(key, row);
  }
  return roles.flatMap((role_id) =>
    actions.map((action) => ({
      role_id,
      permission_action_id: action.id!,
      allowed:
        action.legacyFlag === null
          ? false
          : strictTrue(
              active.get(`${role_id}:${action.service_id}`)?.[
                action.legacyFlag
              ],
            ),
    })),
  );
}
export async function select<T extends object>(
  qi: QueryInterface,
  sql: string,
  transaction?: Transaction,
): Promise<T[]> {
  return qi.sequelize.query<T>(sql, { type: QueryTypes.SELECT, transaction });
}

// All diagnostics expose only table/check names and aggregate counts.
export async function precheck(qi: QueryInterface, transaction?: Transaction) {
  const checks = [
    [
      "permissions orphan roles",
      "SELECT COUNT(*) count FROM permissions p LEFT JOIN roles r ON r.id=p.role_id WHERE r.id IS NULL",
    ],
    [
      "permissions orphan services",
      "SELECT COUNT(*) count FROM permissions p LEFT JOIN services s ON s.id=p.service_id WHERE s.id IS NULL",
    ],
    [
      "users orphan roles",
      "SELECT COUNT(*) count FROM users u LEFT JOIN roles r ON r.id=u.role_id WHERE r.id IS NULL",
    ],
    [
      "users orphan setors",
      "SELECT COUNT(*) count FROM users u LEFT JOIN setors s ON s.id=u.setor_id WHERE u.setor_id IS NOT NULL AND s.id IS NULL",
    ],
    [
      "service_visibilities orphan services",
      "SELECT COUNT(*) count FROM service_visibilities v LEFT JOIN services s ON s.id=v.service_id WHERE s.id IS NULL",
    ],
    [
      "service_visibilities orphan setors",
      "SELECT COUNT(*) count FROM service_visibilities v LEFT JOIN setors s ON s.id=v.setor_id WHERE s.id IS NULL",
    ],
    [
      "permissions duplicate active",
      "SELECT COUNT(*) count FROM (SELECT role_id, service_id FROM permissions WHERE deletedAt IS NULL GROUP BY role_id,service_id HAVING COUNT(*)>1) d",
    ],
    // Equivalent legacy rows are redundant, not ambiguous; preserve them untouched.
    [
      "service_visibilities conflicting duplicate",
      "SELECT COUNT(*) count FROM (SELECT setor_id,service_id FROM service_visibilities GROUP BY setor_id,service_id HAVING COUNT(*)>1 AND COUNT(DISTINCT COALESCE(CAST(visibility AS CHAR),'NULL'))>1) d",
    ],
    [
      "permissions invalid flags",
      "SELECT COUNT(*) count FROM permissions WHERE deletedAt IS NULL AND (`read` IS NULL OR `write` IS NULL OR edit IS NULL OR del IS NULL OR `read` NOT IN (0,1) OR `write` NOT IN (0,1) OR edit NOT IN (0,1) OR del NOT IN (0,1))",
    ],
    [
      "permissions write without read",
      "SELECT COUNT(*) count FROM permissions WHERE deletedAt IS NULL AND `read`=0 AND (`write`=1 OR edit=1 OR del=1)",
    ],
  ];
  for (const [name, sql] of checks) {
    const [row] = await select<{ count: number }>(qi, sql, transaction);
    if (Number(row.count)) {
      const hint =
        name === "service_visibilities conflicting duplicate"
          ? "; read-only diagnostic: scripts/sql/diagnose-permission-visibilities.sql"
          : "";
      throw new Error(
        `Permission migration blocked: ${name}; count=${Number(row.count)}${hint}`,
      );
    }
  }
  const columns = await qi.describeTable("services");
  if (columns.module_key) {
    const [row] = await select<{ count: number }>(
      qi,
      "SELECT COUNT(*) count FROM (SELECT module_key FROM services WHERE module_key IS NOT NULL GROUP BY module_key HAVING COUNT(*)>1) d",
      transaction,
    );
    if (Number(row.count))
      throw new Error(
        `Permission migration blocked: services duplicate module_key; count=${Number(row.count)}`,
      );
  }
}

export async function fillModuleKeys(
  qi: QueryInterface,
  transaction?: Transaction,
) {
  const services = await select<ServiceRow>(
    qi,
    "SELECT id,module_key FROM services ORDER BY id",
    transaction,
  );
  for (const service of services) {
    const expected = moduleForService(service.id);
    if (service.module_key !== null && service.module_key !== expected)
      throw new Error("services.module_key definition mismatch");
    if (service.module_key === null)
      await qi.bulkUpdate(
        "services",
        { module_key: expected },
        { id: service.id },
        { transaction },
      );
    service.module_key = expected;
  }
  return services;
}

export async function ensureCatalog(
  qi: QueryInterface,
  services: ServiceRow[],
  transaction: Transaction,
) {
  const expected = catalogForServices(services);
  const existing = await select<{
    id: number;
    service_id: number;
    module_key: string;
    action: string;
  }>(
    qi,
    "SELECT id,service_id,module_key,action FROM permission_actions ORDER BY id",
    transaction,
  );
  const now = new Date();
  for (const entry of expected) {
    const byService = existing.find(
      (a) => a.service_id === entry.service_id && a.action === entry.action,
    );
    const byModule = existing.find(
      (a) => a.module_key === entry.module_key && a.action === entry.action,
    );
    if (byService || byModule) {
      if (
        !byService ||
        !byModule ||
        byService.id !== byModule.id ||
        byService.module_key !== entry.module_key
      )
        throw new Error("permission_actions definition mismatch");
    } else {
      await qi.bulkInsert(
        "permission_actions",
        [
          {
            service_id: entry.service_id,
            module_key: entry.module_key,
            action: entry.action,
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );
    }
  }
  const persisted = await select<{
    id: number;
    service_id: number;
    module_key: string;
    action: string;
  }>(
    qi,
    "SELECT id,service_id,module_key,action FROM permission_actions ORDER BY id",
    transaction,
  );
  return expected.map((entry) => ({
    ...entry,
    id: persisted.find(
      (a) =>
        a.service_id === entry.service_id &&
        a.module_key === entry.module_key &&
        a.action === entry.action,
    )!.id,
  }));
}

export async function snapshot(qi: QueryInterface, finalizeEmpty = false) {
  await precheck(qi);
  await qi.sequelize.transaction(async (transaction) => {
    const [state] = await select<{ completed: unknown }>(
      qi,
      "SELECT completed FROM permission_migration_state WHERE id=1 FOR UPDATE",
      transaction,
    );
    const services = await fillModuleKeys(qi, transaction);
    const actions = await ensureCatalog(qi, services, transaction);
    if (strictTrue(state.completed)) return;
    const roles = await select<{ id: number }>(
      qi,
      "SELECT id FROM roles ORDER BY id",
      transaction,
    );
    const legacy = await select<LegacyRow>(
      qi,
      "SELECT role_id,service_id,`read`,`write`,edit,del,deletedAt FROM permissions",
      transaction,
    );
    // No users check: roles without users must be migrated normally.
    if (!finalizeEmpty && (services.length === 0 || legacy.length === 0))
      return;
    const expected = buildSnapshot(
      roles.map((r) => r.id),
      actions,
      legacy,
    );
    const current = await select<{
      role_id: number;
      permission_action_id: number;
      allowed: unknown;
    }>(
      qi,
      "SELECT role_id,permission_action_id,allowed FROM role_permissions",
      transaction,
    );
    if (
      current.some(
        (g) =>
          !expected.some(
            (e) =>
              e.role_id === g.role_id &&
              e.permission_action_id === g.permission_action_id &&
              e.allowed === strictTrue(g.allowed),
          ),
      )
    )
      throw new Error("role_permissions: incomplete snapshot differs");
    const missing = expected.filter(
      (e) =>
        !current.some(
          (g) =>
            g.role_id === e.role_id &&
            g.permission_action_id === e.permission_action_id,
        ),
    );
    const now = new Date();
    for (let i = 0; i < missing.length; i += 500)
      await qi.bulkInsert(
        "role_permissions",
        missing
          .slice(i, i + 500)
          .map((g) => ({ ...g, createdAt: now, updatedAt: now })),
        { transaction },
      );
    const actual = await select<{
      role_id: number;
      permission_action_id: number;
      allowed: unknown;
    }>(
      qi,
      "SELECT role_id,permission_action_id,allowed FROM role_permissions",
      transaction,
    );
    if (
      actual.length !== expected.length ||
      actual.some(
        (g) =>
          !expected.some(
            (e) =>
              e.role_id === g.role_id &&
              e.permission_action_id === g.permission_action_id &&
              e.allowed === strictTrue(g.allowed),
          ),
      )
    )
      throw new Error("role_permissions: snapshot verification failed");
    await qi.bulkUpdate(
      "permission_migration_state",
      { completed: true, completedAt: now },
      { id: 1 },
      { transaction },
    );
  });
}

export async function rollbackSnapshot(qi: QueryInterface) {
  const tables = await permissionTableNames(qi);
  if (!tables.includes("permission_actions")) return;
  await precheck(qi);
  await qi.sequelize.transaction(async (transaction) => {
    await select(
      qi,
      "SELECT completed FROM permission_migration_state WHERE id=1 FOR UPDATE",
      transaction,
    );
    const services = await select<ServiceRow>(
      qi,
      "SELECT id,module_key FROM services ORDER BY id",
      transaction,
    );
    const expectedActions = catalogForServices(services);
    const actualActions = await select<ActionRow>(
      qi,
      "SELECT id,service_id,module_key,action FROM permission_actions ORDER BY id",
      transaction,
    );
    // Unused structure down is repeatable; any unexpected action blocks before DELETE.
    if (
      actualActions.some(
        (a) =>
          !expectedActions.some(
            (e) =>
              e.service_id === a.service_id &&
              e.module_key === a.module_key &&
              e.action === a.action,
          ),
      )
    )
      throw new Error("Unsafe rollback: permission_actions changed");
    const [state] = await select<{ completed: unknown }>(
      qi,
      "SELECT completed FROM permission_migration_state WHERE id=1",
      transaction,
    );
    const current = await select<{
      role_id: number;
      permission_action_id: number;
      allowed: unknown;
    }>(
      qi,
      "SELECT role_id,permission_action_id,allowed FROM role_permissions",
      transaction,
    );
    if (strictTrue(state.completed)) {
      if (actualActions.length !== expectedActions.length)
        throw new Error("Unsafe rollback: permission_actions missing");
      const roles = await select<{ id: number }>(
        qi,
        "SELECT id FROM roles ORDER BY id",
        transaction,
      );
      const legacy = await select<LegacyRow>(
        qi,
        "SELECT role_id,service_id,`read`,`write`,edit,del,deletedAt FROM permissions",
        transaction,
      );
      const actions = actualActions.map((a) => ({
        ...a,
        legacyFlag: expectedActions.find(
          (e) => e.service_id === a.service_id && e.action === a.action,
        )!.legacyFlag,
      }));
      const expected = buildSnapshot(
        roles.map((r) => r.id),
        actions,
        legacy,
      );
      if (
        current.length !== expected.length ||
        current.some(
          (g) =>
            !expected.some(
              (e) =>
                e.role_id === g.role_id &&
                e.permission_action_id === g.permission_action_id &&
                e.allowed === strictTrue(g.allowed),
            ),
        )
      )
        throw new Error("Unsafe rollback: role_permissions changed");
    } else if (current.length)
      throw new Error("Unsafe rollback: grants without completed snapshot");
    await qi.bulkDelete("role_permissions", {}, { transaction });
    await qi.bulkDelete("permission_actions", {}, { transaction });
    await qi.bulkUpdate(
      "permission_migration_state",
      { completed: false, completedAt: null },
      { id: 1 },
      { transaction },
    );
  });
}
