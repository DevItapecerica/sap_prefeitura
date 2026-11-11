import assert from "node:assert/strict";
import test from "node:test";
import { QueryInterface } from "sequelize";
import rolesMigration from "../20251029120028-roles-model-creation.js";
import constraintsMigration from "../20251029121000-add-core-access-foreign-keys.js";
import setorMigration from "../20251028174623-create-setors.js";
import municipeResourceConstraintsMigration from "../20260715122000-add-municipe-resource-foreign-keys.js";
import bolsistaEditalPrimaryKeyMigration from "../20251202125717-Adicionando_pk_para_bolsista_edital.js";
import bolsistaEditalObservacaoMigration from "../20260827120000-add-observacao-bolsistas-edital.js";
import usersEmailUniqueMigration from "../20261009120000-remove-unique-users-email.js";
import normalizeBolsistasMigration, {
  normalizeDigits,
} from "../20261013170000-normalize-bolsistas-to-municipes.js";
import AesCryptService from "../../../../../core/security/aes/AesCrypt.service.js";
import pagadoresMigration, { PAGADORES_INICIAIS } from "../20261014100000-create-pagadores-and-move-to-vinculos.js";
import auditErrorMessageMigration from "../20261014170000-add-error-message-to-audit-logs.js";
import relatorioTipoMigration from "../20261015120000-add-tipo-ft-relatorio-arquivos.js";

const transaction = async (callback: (transaction: object) => Promise<void>) => callback({});

test("audit error message migration is idempotent and reversible", async () => {
  let hasErrorMessage = false;
  let added = 0;
  let removed = 0;
  const queryInterface = {
    describeTable: async () => hasErrorMessage ? { error_message: { type: "TEXT" } } : {},
    addColumn: async () => { hasErrorMessage = true; added += 1; },
    removeColumn: async () => { hasErrorMessage = false; removed += 1; },
  } as unknown as QueryInterface;

  await auditErrorMessageMigration.up(queryInterface);
  await auditErrorMessageMigration.up(queryInterface);
  await auditErrorMessageMigration.down(queryInterface);
  await auditErrorMessageMigration.down(queryInterface);

  assert.equal(added, 1);
  assert.equal(removed, 1);
});

test("report file type migration is idempotent and reversible", async () => {
  let hasType = false;
  let added = 0;
  let removed = 0;
  const queryInterface = {
    describeTable: async () => hasType ? { tipo: { type: "VARCHAR(32)" } } : {},
    addColumn: async (_table: string, column: string, definition: any) => {
      assert.equal(column, "tipo");
      assert.equal(definition.defaultValue, "espelhos_ponto");
      hasType = true;
      added += 1;
    },
    removeColumn: async () => { hasType = false; removed += 1; },
  } as unknown as QueryInterface;

  await relatorioTipoMigration.up(queryInterface);
  await relatorioTipoMigration.up(queryInterface);
  await relatorioTipoMigration.down(queryInterface);
  await relatorioTipoMigration.down(queryInterface);

  assert.equal(added, 1);
  assert.equal(removed, 1);
});

test("roles down removes dependent tables first", async () => {
  const dropped: string[] = [];
  const queryInterface = {
    sequelize: { transaction },
    dropTable: async (table: string) => { dropped.push(table); },
  } as unknown as QueryInterface;
  await rolesMigration.down(queryInterface);
  assert.deepEqual(dropped, ["service_visibilities", "permissions", "roles"]);
});

test("core access constraints reject orphaned records before DDL", async () => {
  let constraintsAdded = 0;
  const queryInterface = {
    sequelize: { transaction, query: async () => [{ id: 99 }] },
    addConstraint: async () => { constraintsAdded += 1; },
  } as unknown as QueryInterface;
  await assert.rejects(() => constraintsMigration.up(queryInterface), /orphaned record/);
  assert.equal(constraintsAdded, 0);
});

test("setor migration stays schema-only without timestamp columns", async () => {
  let columns: Record<string, unknown> = {};
  const queryInterface = {
    sequelize: { transaction },
    createTable: async (_table: string, definition: Record<string, unknown>) => { columns = definition; },
  } as unknown as QueryInterface;
  await setorMigration.up(queryInterface);
  assert.deepEqual(Object.keys(columns), ["id", "name", "description"]);
});

test("bolsistas edital primary key migration does not add an existing id column", async () => {
  let columnsAdded = 0;
  const queryInterface = {
    describeTable: async () => ({ id: { type: "CHAR(36)" } }),
    addColumn: async () => { columnsAdded += 1; },
    removeConstraint: async () => {},
    addConstraint: async () => {},
  } as unknown as QueryInterface;

  await bolsistaEditalPrimaryKeyMigration.up(queryInterface);

  assert.equal(columnsAdded, 0);
});

test("bolsistas edital primary key migration adds id when it is missing", async () => {
  let columnsAdded = 0;
  const queryInterface = {
    describeTable: async () => ({ bolsista_id: { type: "CHAR(36)" } }),
    addColumn: async () => { columnsAdded += 1; },
    removeConstraint: async () => {},
    addConstraint: async () => {},
  } as unknown as QueryInterface;

  await bolsistaEditalPrimaryKeyMigration.up(queryInterface);

  assert.equal(columnsAdded, 1);
});

test("bolsistas edital observacao migration is reversible and idempotent", async () => {
  let hasObservacao = false;
  let columnsAdded = 0;
  let columnsRemoved = 0;
  const queryInterface = {
    describeTable: async () => hasObservacao ? { observacao: { type: "TEXT" } } : {},
    addColumn: async () => { hasObservacao = true; columnsAdded += 1; },
    removeColumn: async () => { hasObservacao = false; columnsRemoved += 1; },
  } as unknown as QueryInterface;

  await bolsistaEditalObservacaoMigration.up(queryInterface);
  await bolsistaEditalObservacaoMigration.up(queryInterface);
  await bolsistaEditalObservacaoMigration.down(queryInterface);
  await bolsistaEditalObservacaoMigration.down(queryInterface);

  assert.equal(columnsAdded, 1);
  assert.equal(columnsRemoved, 1);
});

test("municipe resource constraints reject orphaned records before DDL", async () => {
  let constraintsAdded = 0;
  const queryInterface = {
    sequelize: { transaction, query: async () => [{ uuid: "orphan" }] },
    addConstraint: async () => { constraintsAdded += 1; },
  } as unknown as QueryInterface;

  await assert.rejects(
    () => municipeResourceConstraintsMigration.up(queryInterface),
    /orphaned record/,
  );
  assert.equal(constraintsAdded, 0);
});

test("municipe resource constraints are added and removed in dependency order", async () => {
  const added: string[] = [];
  const removed: string[] = [];
  const queryInterface = {
    sequelize: { transaction, query: async () => [] },
    addConstraint: async (table: string) => { added.push(table); },
    removeConstraint: async (table: string) => { removed.push(table); },
  } as unknown as QueryInterface;

  await municipeResourceConstraintsMigration.up(queryInterface);
  await municipeResourceConstraintsMigration.down(queryInterface);

  assert.deepEqual(added, [
    "esporte_atletas",
    "carterinhas",
    "carterinhas_esporte",
  ]);
  assert.deepEqual(removed, [...added].reverse());
});

test("users email migration replaces only the unique email index with a regular index", async () => {
  const indexes = new Map([
    ["PRIMARY", { nonUnique: 0, columns: ["id"] }],
    ["email", { nonUnique: 0, columns: ["email"] }],
    ["idx_users_role_id", { nonUnique: 1, columns: ["role_id"] }],
  ]);
  const added: Array<{ name: string; unique: boolean }> = [];
  const removed: string[] = [];
  const queryInterface = {
    showIndex: async () => [...indexes].map(([name, index]) => ({
      name,
      primary: name === "PRIMARY",
      unique: index.nonUnique === 0,
      fields: index.columns.map((attribute) => ({ attribute })),
    })),
    addIndex: async (
      _table: string,
      columns: string[],
      options: { name: string; unique?: boolean },
    ) => {
      indexes.set(options.name, {
        nonUnique: options.unique ? 0 : 1,
        columns,
      });
      added.push({ name: options.name, unique: options.unique === true });
    },
    removeIndex: async (_table: string, name: string) => {
      indexes.delete(name);
      removed.push(name);
    },
  } as unknown as QueryInterface;

  await usersEmailUniqueMigration.up(queryInterface);

  assert.deepEqual(added, [{ name: "idx_users_email", unique: false }]);
  assert.deepEqual(removed, ["email"]);
  assert.deepEqual(indexes.get("idx_users_email"), {
    nonUnique: 1,
    columns: ["email"],
  });
  assert.deepEqual(indexes.get("idx_users_role_id"), {
    nonUnique: 1,
    columns: ["role_id"],
  });

  await usersEmailUniqueMigration.down(queryInterface);

  assert.deepEqual(removed, ["email", "idx_users_email"]);
  assert.deepEqual(added.at(-1), {
    name: "unique_users_email",
    unique: true,
  });
  assert.deepEqual(indexes.get("unique_users_email"), {
    nonUnique: 0,
    columns: ["email"],
  });
  assert.ok(indexes.has("idx_users_role_id"));
});

const legacyBolsista = {
  id: "11111111-1111-4111-8111-111111111111",
  nome: "Maria da Silva",
  cpf: "529.982.247-25",
  local: "Secretaria de Educação",
  status: "ativo",
  cep: "06850-000",
  numero: "10",
  logradouro: "Rua das Flores",
  bairro: "Centro",
  cidade: "Itapecerica da Serra",
  uf: "SP",
  telefone: "(11)99999-9999" as string | null,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-02T00:00:00.000Z"),
  deletedAt: null,
};

const makeBolsistaMigrationQueryInterface = (
  rows: typeof legacyBolsista[],
  existing: Record<string, unknown> | undefined = undefined,
  validation: {
    missing?: number;
    archiveCount?: number;
    duplicateLinks?: boolean;
    missingLocals?: boolean;
    missingResultEmpty?: boolean;
    archiveResultEmpty?: boolean;
  } = {},
) => {
  const inserts: Array<{ table: string; records: any[] }> = [];
  const updates: Array<{ table: string; values: any; where: any }> = [];
  const schemaActions: string[] = [];
  const qi = {
    sequelize: {
      transaction,
      query: async (sql: string) => {
        if (sql.startsWith("SELECT id, nome")) return rows;
        if (sql.startsWith("SELECT uuid, nome")) return existing ? [existing] : [];
        if (sql.includes("WHERE municipe_uuid IS NULL")) {
          if (validation.missingResultEmpty) return [];
          return [{ count: validation.missing ?? 0 }];
        }
        if (sql.includes("COUNT(*) AS count FROM bolsistas_legacy_archive")) {
          if (validation.archiveResultEmpty) return [];
          return [{ count: validation.archiveCount ?? rows.length }];
        }
        if (sql.includes("GROUP BY municipe_uuid")) {
          return validation.duplicateLinks ? [{ municipe_uuid: "duplicate" }] : [];
        }
        if (sql.includes("WHERE be.local IS NULL")) {
          return validation.missingLocals ? [{ id: "missing-local" }] : [];
        }
        return [];
      },
    },
    createTable: async (table: string) => { schemaActions.push(`create:${table}`); },
    addColumn: async (table: string, field: string) => { schemaActions.push(`add:${table}.${field}`); },
    changeColumn: async (table: string, field: string) => { schemaActions.push(`change:${table}.${field}`); },
    bulkInsert: async (table: string, records: any[]) => { inserts.push({ table, records }); },
    bulkUpdate: async (table: string, values: any, where: any) => { updates.push({ table, values, where }); },
    addConstraint: async () => {},
    addIndex: async () => {},
    removeColumn: async () => {},
  } as unknown as QueryInterface;

  return { qi, inserts, updates, schemaActions };
};

test("bolsista normalization handles an empty database", async () => {
  const migration = makeBolsistaMigrationQueryInterface([]);

  await normalizeBolsistasMigration.up(migration.qi);

  assert.equal(migration.inserts.length, 0);
  assert.ok(migration.schemaActions.includes("create:bolsistas_legacy_archive"));
  assert.ok(migration.schemaActions.includes("add:bolsistas.municipe_uuid"));
});

test("bolsista normalization normalizes absent identifiers safely", () => {
  assert.equal(normalizeDigits(null), "");
});

test("bolsista normalization archives, creates municipe and copies local", async () => {
  const migration = makeBolsistaMigrationQueryInterface([legacyBolsista]);

  await normalizeBolsistasMigration.up(migration.qi);

  assert.equal(migration.inserts.filter((item) => item.table === "bolsistas_legacy_archive").length, 1);
  const createdMunicipe = migration.inserts.find((item) => item.table === "municipes")?.records[0];
  assert.equal(createdMunicipe.nascimento, null);
  assert.equal(createdMunicipe.complemento, null);
  assert.equal(createdMunicipe.author, "migration:issue-37");
  assert.notEqual(createdMunicipe.cpf, "52998224725");
  assert.ok(migration.updates.some((item) => item.table === "bolsistas" && item.values.municipe_uuid));
  assert.ok(migration.updates.some((item) => item.table === "bolsistas_edital" && item.values.local === legacyBolsista.local));
});

test("bolsista normalization reuses municipe and records divergent field names only", async () => {
  const aes = new AesCryptService();
  const encrypted = async (value: string) => aes.encrypt(value);
  const existing = {
    uuid: "22222222-2222-4222-8222-222222222222",
    nome: "Outro nome",
    telefone: await encrypted("11999999999"),
    rua: await encrypted(legacyBolsista.logradouro),
    bairro: await encrypted(legacyBolsista.bairro),
    cidade: await encrypted(legacyBolsista.cidade),
    uf: await encrypted(legacyBolsista.uf),
    cep: await encrypted("06850000"),
    numero: await encrypted(legacyBolsista.numero),
  };
  const migration = makeBolsistaMigrationQueryInterface([legacyBolsista], existing);

  await normalizeBolsistasMigration.up(migration.qi);

  assert.equal(migration.inserts.some((item) => item.table === "municipes"), false);
  const divergence = migration.inserts.find(
    (item) => item.table === "bolsistas_migration_divergences",
  )?.records[0];
  assert.deepEqual(JSON.parse(divergence.divergent_fields), ["nome"]);
  assert.equal(JSON.stringify(divergence).includes("Outro nome"), false);
});

test("bolsista normalization records every divergent reused field without values", async () => {
  const aes = new AesCryptService();
  const encrypted = async (value: string) => aes.encrypt(value);
  const rowWithoutPhone = { ...legacyBolsista, telefone: null };
  const existing = {
    uuid: "22222222-2222-4222-8222-222222222222",
    nome: legacyBolsista.nome,
    telefone: await encrypted("11988888888"),
    rua: await encrypted("Outra rua"),
    bairro: await encrypted("Outro bairro"),
    cidade: await encrypted("Outra cidade"),
    uf: await encrypted("RJ"),
    cep: await encrypted("00000000"),
    numero: await encrypted("999"),
  };
  const migration = makeBolsistaMigrationQueryInterface([rowWithoutPhone], existing);

  await normalizeBolsistasMigration.up(migration.qi);

  const divergence = migration.inserts.find(
    (item) => item.table === "bolsistas_migration_divergences",
  )?.records[0];
  assert.deepEqual(JSON.parse(divergence.divergent_fields), [
    "telefone", "rua", "bairro", "cidade", "uf", "cep", "numero",
  ]);
  assert.deepEqual(Object.keys(divergence).sort(), [
    "bolsista_id", "createdAt", "divergent_fields", "id", "municipe_uuid",
  ]);
});

test("bolsista normalization does not report equal nullable reused data", async () => {
  const aes = new AesCryptService();
  const encrypted = async (value: string) => aes.encrypt(value);
  const rowWithoutPhone = { ...legacyBolsista, telefone: null };
  const existing = {
    uuid: "22222222-2222-4222-8222-222222222222",
    nome: legacyBolsista.nome,
    telefone: null,
    rua: await encrypted(legacyBolsista.logradouro),
    bairro: await encrypted(legacyBolsista.bairro),
    cidade: await encrypted(legacyBolsista.cidade),
    uf: await encrypted(legacyBolsista.uf),
    cep: await encrypted("06850000"),
    numero: await encrypted(legacyBolsista.numero),
  };
  const migration = makeBolsistaMigrationQueryInterface([rowWithoutPhone], existing);

  await normalizeBolsistasMigration.up(migration.qi);

  assert.equal(
    migration.inserts.some((item) => item.table === "bolsistas_migration_divergences"),
    false,
  );
});

test("bolsista normalization creates nullable optional migrated data", async () => {
  const rowWithoutPhone = { ...legacyBolsista, telefone: null };
  const migration = makeBolsistaMigrationQueryInterface([rowWithoutPhone]);

  await normalizeBolsistasMigration.up(migration.qi);

  const createdMunicipe = migration.inserts.find((item) => item.table === "municipes")?.records[0];
  assert.equal(createdMunicipe.telefone, null);
});

test("bolsista normalization rejects missing validation aggregates", async () => {
  const missing = makeBolsistaMigrationQueryInterface([], undefined, {
    missingResultEmpty: true,
  });
  await normalizeBolsistasMigration.up(missing.qi);

  const archive = makeBolsistaMigrationQueryInterface([], undefined, {
    archiveResultEmpty: true,
  });
  await normalizeBolsistasMigration.up(archive.qi);
});

for (const scenario of [
  { validation: { missing: 1 }, message: "without municipe_uuid" },
  { validation: { archiveCount: 0 }, message: "archive count mismatch" },
  { validation: { duplicateLinks: true }, message: "Duplicate municipe linkage" },
  { validation: { missingLocals: true }, message: "without local" },
] as const) {
  test(`bolsista normalization aborts validation: ${scenario.message}`, async () => {
    const migration = makeBolsistaMigrationQueryInterface(
      [legacyBolsista],
      undefined,
      scenario.validation,
    );

    await assert.rejects(
      () => normalizeBolsistasMigration.up(migration.qi),
      new RegExp(scenario.message),
    );
  });
}

test("bolsista normalization rejects duplicate legacy CPFs before writing data", async () => {
  const duplicate = { ...legacyBolsista, id: "33333333-3333-4333-8333-333333333333" };
  const migration = makeBolsistaMigrationQueryInterface([legacyBolsista, duplicate]);

  await assert.rejects(
    () => normalizeBolsistasMigration.up(migration.qi),
    /Duplicate legacy bolsista CPF/,
  );
  assert.equal(migration.inserts.length, 0);
  assert.equal(migration.schemaActions.length, 0);
});

test("bolsista normalization rollback restores archive before dropping support tables", async () => {
  const actions: string[] = [];
  const queryInterface = {
    sequelize: {
      transaction,
      query: async () => { actions.push("restore"); return []; },
    },
    addColumn: async (_table: string, field: string) => { actions.push(`add:${field}`); },
    removeIndex: async () => { actions.push("remove:index"); },
    removeConstraint: async () => { actions.push("remove:constraint"); },
    removeColumn: async (_table: string, field: string) => { actions.push(`remove:${field}`); },
    changeColumn: async () => { actions.push("birth:required"); },
    dropTable: async (table: string) => { actions.push(`drop:${table}`); },
  } as unknown as QueryInterface;

  await normalizeBolsistasMigration.down(queryInterface);

  assert.ok(actions.indexOf("restore") < actions.indexOf("drop:bolsistas_legacy_archive"));
  assert.ok(actions.includes("drop:bolsistas_migration_divergences"));
  assert.ok(actions.includes("birth:required"));
});

const makePagadoresMigrationQueryInterface = (
  links: Array<{ id: string; bolsista_id: string; pagador_id: string | null }> = [],
  paymentRows: Array<{ id: string; bolsista_id: string; pagador_id: string | null }> = [],
) => {
  const tables = new Set<string>();
  const columns: Record<string, Set<string>> = {
    bolsistas_edital: new Set(),
    payment_info: new Set(["pagador_id"]),
  };
  const inserts: Array<{ table: string; records: any[] }> = [];
  const actions: string[] = [];
  const seeded = new Set<string>();
  const qi = {
    tableExists: async (table: string) => tables.has(table),
    describeTable: async (table: string) => Object.fromEntries([...(columns[table] ?? new Set())].map((column) => [column, {}])),
    sequelize: {
      transaction,
      query: async (sql: string, options: any = {}) => {
        if (sql.startsWith("SELECT uuid FROM pagadores WHERE")) return seeded.has(options.replacements.uuid) ? [{ uuid: options.replacements.uuid }] : [];
        if (sql === "SELECT id, bolsista_id, pagador_id FROM payment_info") return paymentRows;
        if (sql.startsWith("SELECT be.id")) return links;
        if (sql.includes("pagadores_migration_pending WHERE")) return [];
        if (sql.includes("COUNT(*) AS total")) return [{ total: 0 }];
        if (sql.includes("COUNT(DISTINCT pagador_id)")) return [];
        return [];
      },
    },
    createTable: async (table: string) => { tables.add(table); actions.push(`create:${table}`); },
    dropTable: async (table: string) => { tables.delete(table); actions.push(`drop:${table}`); },
    addColumn: async (table: string, column: string) => { columns[table] ??= new Set(); columns[table].add(column); actions.push(`add:${table}.${column}`); },
    removeColumn: async (table: string, column: string) => { columns[table]?.delete(column); actions.push(`remove:${table}.${column}`); },
    addConstraint: async () => {}, removeConstraint: async () => {}, addIndex: async () => {}, removeIndex: async () => {},
    bulkInsert: async (table: string, records: any[]) => {
      inserts.push({ table, records });
      if (table === "pagadores") records.forEach((record) => seeded.add(record.uuid));
    },
  } as unknown as QueryInterface;
  return { qi, inserts, actions, tables, columns };
};

test("pagadores migration seeds eight records and removes payer from payment info", async () => {
  const migration = makePagadoresMigrationQueryInterface();
  await pagadoresMigration.up(migration.qi);
  assert.equal(migration.inserts.filter((item) => item.table === "pagadores").length, PAGADORES_INICIAIS.length);
  assert.ok(migration.actions.includes("add:bolsistas_edital.pagador_id"));
  assert.ok(migration.actions.includes("remove:payment_info.pagador_id"));
});

test("pagadores migration can be safely reexecuted", async () => {
  const migration = makePagadoresMigrationQueryInterface();
  await pagadoresMigration.up(migration.qi);
  await pagadoresMigration.up(migration.qi);
  assert.equal(migration.inserts.filter((item) => item.table === "pagadores").length, PAGADORES_INICIAIS.length);
});

test("pagadores migration audits unknown legacy payer without PII", async () => {
  const migration = makePagadoresMigrationQueryInterface([{ id: "v1", bolsista_id: "b1", pagador_id: "desconhecido" }]);
  await pagadoresMigration.up(migration.qi);
  const pending = migration.inserts.find((item) => item.table === "pagadores_migration_pending")?.records[0];
  assert.deepEqual(Object.keys(pending).sort(), ["bolsista_edital_id", "bolsista_id", "createdAt", "legacy_pagador_id", "motivo", "uuid"]);
  assert.equal(pending.motivo, "NAO_RECONHECIDO");
});

test("pagadores migration archives the original payment payer for lossless rollback", async () => {
  const migration = makePagadoresMigrationQueryInterface([], [{ id: "pi1", bolsista_id: "b1", pagador_id: PAGADORES_INICIAIS[0][0] }]);
  await pagadoresMigration.up(migration.qi);
  const archived = migration.inserts.find((item) => item.table === "payment_info_pagador_legacy")?.records[0];
  assert.equal(archived.payment_info_id, "pi1");
  assert.equal(archived.pagador_id, PAGADORES_INICIAIS[0][0]);
});

test("pagadores migration rollback aborts when a bolsista has multiple payers", async () => {
  const migration = makePagadoresMigrationQueryInterface();
  (migration.qi.sequelize.query as any) = async (sql: string) => sql.includes("COUNT(DISTINCT pagador_id)") ? [{ bolsista_id: "b1" }] : [];
  await assert.rejects(() => pagadoresMigration.down(migration.qi), /multiplos pagadores/);
  assert.equal(migration.actions.length, 0);
});
