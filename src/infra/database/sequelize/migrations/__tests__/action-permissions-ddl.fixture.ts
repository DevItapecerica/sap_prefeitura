export function ddlFixture() {
  const operations: string[] = [];
  const tables: Record<string, any[]> = {
    services: [column('id', 'int', false, true, true)],
    roles: [column('id', 'int', false, true, true)],
  };
  const indexes: Record<string, any[]> = {};
  const fks: Record<string, any[]> = {};
  let states: any[] = [];
  let services: any[] = [{ id: 6, module_key: null }];
  const qi: any = {
    describeTable: async (table: string) => Object.fromEntries(tables[table].map(c => [c.Field, c])),
    showAllTables: async () => Object.keys(tables),
    addColumn: async (table: string, field: string) => { operations.push(`addColumn:${field}`); tables[table].push(column(field, 'varchar(64)', true)); },
    changeColumn: async (table: string, field: string, options: any) => { operations.push(`changeColumn:${field}`); tables[table].find(c => c.Field === field).Null = options.allowNull ? 'YES' : 'NO'; },
    createTable: async (table: string, definition: any) => {
      operations.push(`createTable:${table}`);
      tables[table] = Object.entries(definition).map(([field, d]: [string, any]) => {
        const type = field === 'module_key' ? 'varchar(64)' : field === 'action' ? 'varchar(96)' :
          ['createdAt', 'updatedAt', 'completedAt'].includes(field) ? 'datetime' : ['allowed', 'completed'].includes(field) ? 'tinyint(1)' : 'int(11)';
        return { ...column(field, type, d.allowNull, d.primaryKey, d.autoIncrement), Default: d.defaultValue === false ? '0' : null };
      });
    },
    showIndex: async (table: string) => indexes[table] ?? [],
    addIndex: async (table: string, fields: string[], options: any) => { operations.push(`addIndex:${options.name}`); (indexes[table] ??= []).push({ name: options.name, unique: options.unique, fields: fields.map(attribute => ({ attribute })) }); },
    addConstraint: async (table: string, options: any) => {
      operations.push(`addConstraint:${options.name}`);
      fks[options.name] = options.fields.map((field: string, index: number) => ({ column_name: field, referenced_table_name: options.references.table, referenced_column_name: options.references.fields[index], update_rule: options.onUpdate, delete_rule: options.onDelete }));
    },
    bulkInsert: async (_table: string, rows: any[]) => { states = rows; operations.push('state'); },
    bulkUpdate: async (_table: string, values: any) => { services = services.map(s => ({ ...s, ...values })); },
    dropTable: async (table: string) => { operations.push(`dropTable:${table}`); delete tables[table]; },
    removeIndex: async (_table: string, name: string) => operations.push(`removeIndex:${name}`),
    removeColumn: async (table: string, field: string) => { operations.push(`removeColumn:${field}`); tables[table] = tables[table].filter(c => c.Field !== field); },
    sequelize: { query: async (sql: string, options: any) => {
      if (sql.startsWith('SELECT COUNT')) return [{ count: 0 }];
      if (sql.startsWith('SHOW FULL COLUMNS')) return tables[sql.replace('SHOW FULL COLUMNS FROM ', '').replaceAll('`', '')];
      if (sql.includes('REFERENTIAL_CONSTRAINTS')) return fks[options.replacements.name] ?? [];
      if (sql.includes('information_schema.KEY_COLUMN_USAGE')) return [];
      if (sql.includes('FROM permission_migration_state')) return states;
      if (sql.includes('FROM services')) return services;
      throw new Error(`Unsupported fixture SQL: ${sql}`);
    } },
  };
  return { qi, operations, tables, indexes, fks, setServices: (rows: any[]) => { services = rows; }, setState: (rows: any[]) => { states = rows; } };
}
function column(Field: string, Type: string, nullable: boolean, primary = false, auto = false) {
  return { Field, Type, Null: nullable ? 'YES' : 'NO', Key: primary ? 'PRI' : '', Extra: auto ? 'auto_increment' : '', Collation: Type.startsWith('varchar') ? 'ascii_bin' : null, Default: null };
}
