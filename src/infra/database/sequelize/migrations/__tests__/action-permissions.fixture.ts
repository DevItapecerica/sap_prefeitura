// Stateful QueryInterface double. SQL is deliberately limited to migration queries.
export function accessFixture() {
  const data: Record<string, any[]> = {
    services: [{ id: 6, module_key: 'ft' }], roles: [{ id: 1 }, { id: 2 }],
    permissions: [{ role_id: 1, service_id: 6, read: 1, write: 0, edit: 1, del: 0, deletedAt: null }],
    permission_actions: [], role_permissions: [], permission_migration_state: [{ id: 1, completed: false, completedAt: null }],
  };
  const operations: string[] = [];
  let failure: string | undefined;
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  const columns = { module_key: { type: 'VARCHAR(64)', allowNull: true } };
  const fks: Record<string, any[]> = {};
  const qi: any = {
    showAllTables: async () => Object.keys(data),
    describeTable: async () => columns,
    changeColumn: async (_table: string, _field: string, options: any) => {
      if (fks.fk_permission_actions_service_module) throw new Error('ER_FK_COLUMN_CANNOT_CHANGE');
      operations.push('changeColumn'); columns.module_key.allowNull = options.allowNull;
    },
    addConstraint: async (_table: string, options: any) => {
      if (failure === `constraint:${options.name}`) throw new Error('injected failure');
      if (options.name === 'fk_permission_actions_service_module' && columns.module_key.allowNull) throw new Error('ER_CANT_CREATE_TABLE');
      operations.push(`addConstraint:${options.name}`);
      fks[options.name] = options.fields.map((field: string, index: number) => ({ column_name: field, referenced_table_name: options.references.table, referenced_column_name: options.references.fields[index], update_rule: options.onUpdate, delete_rule: options.onDelete }));
    },
    sequelize: {
      transaction: async (callback: any) => {
        const before = structuredClone(data);
        operations.push('begin');
        try { const result = await callback(transaction); operations.push('commit'); return result; }
        catch (error) { for (const k of Object.keys(data)) data[k] = before[k]; operations.push('rollback'); throw error; }
      },
      query: async (sql: string, options: any) => {
        operations.push(sql);
        if (failure && sql.includes(failure)) throw new Error('injected failure');
        if (sql.includes('REFERENTIAL_CONSTRAINTS')) return structuredClone(fks[options.replacements.name] ?? []);
        if (sql.startsWith('SELECT COUNT')) return [{ count: 0 }];
        if (sql.includes('FROM permission_migration_state')) return structuredClone(data.permission_migration_state);
        for (const table of ['permission_actions', 'role_permissions', 'permissions', 'services', 'roles']) if (sql.includes(`FROM ${table}`)) {
          if (options.transaction !== transaction) throw new Error('DML read without transaction');
          return structuredClone(data[table]);
        }
        throw new Error(`Unsupported fixture SQL: ${sql}`);
      },
    },
    bulkInsert: async (table: string, rows: any[], options: any) => {
      if (options.transaction !== transaction) throw new Error('DML write without transaction');
      if (failure === `insert:${table}`) throw new Error('injected failure');
      operations.push(`insert:${table}`);
      rows.forEach(row => data[table].push({ id: data[table].length + 1, ...row }));
    },
    bulkUpdate: async (table: string, values: any, where: any, options: any) => {
      if (options.transaction !== transaction) throw new Error('DML write without transaction');
      if (failure === `update:${table}`) throw new Error('injected failure');
      operations.push(`update:${table}`);
      data[table].filter(row => Object.keys(where).every(key => row[key] === where[key])).forEach(row => Object.assign(row, values));
    },
    bulkDelete: async (table: string, _where: any, options: any) => {
      if (options.transaction !== transaction) throw new Error('DML write without transaction');
      operations.push(`delete:${table}`); data[table] = [];
    },
  };
  return { data, operations, qi, columns, fks, fail: (value: string) => { failure = value; } };
}
