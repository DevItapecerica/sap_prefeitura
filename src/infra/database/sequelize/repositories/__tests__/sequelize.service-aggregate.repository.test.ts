import assert from "node:assert/strict";
import test from "node:test";
import { SequelizeServiceAggregateRepository } from "../sequelize.service-aggregate.repository.js";

type RowState = Record<string, unknown>;

class FakeRow {
  constructor(
    readonly state: RowState,
    private readonly shouldFail: () => boolean = () => false,
  ) {}

  get(key?: string) {
    return key ? this.state[key] : this.state;
  }

  async update(input: RowState) {
    if (this.shouldFail()) throw new Error("write failed");
    Object.assign(this.state, input, { updatedAt: new Date("2026-01-02") });
    return this;
  }

  async destroy() {
    if (this.shouldFail()) throw new Error("delete failed");
    this.state.deletedAt = new Date("2026-01-02");
    return this;
  }
}

const makeDatabase = () => {
  let failPermission = false;
  let failVisibility = false;
  let failService = false;
  const service = new FakeRow({
    id: 6,
    name: "FT",
    description: "Frente de Trabalho",
    tag: "ft",
    url: "/ft",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    deletedAt: null,
  }, () => failService);
  const permissions = [
    new FakeRow(
      { id: 1, service_id: 6, role_id: 1, read: true, write: false, edit: false, del: false },
      () => failPermission,
    ),
  ];
  const visibilities = [
    new FakeRow(
      { id: 1, service_id: 6, setor_id: 1, visibility: false },
      () => failVisibility,
    ),
  ];
  const lockCalls: unknown[] = [];
  const allRows = [service, ...permissions, ...visibilities];

  const database = {
    ServiceModel: {
      findByPk: async (id: number, options: object) => {
        lockCalls.push(options);
        return id === 6 && service.state.deletedAt == null ? service : null;
      },
    },
    PermissionsModel: {
      findAll: async (options: object) => { lockCalls.push(options); return permissions; },
    },
    ServiceVisibilities: {
      findAll: async (options: object) => { lockCalls.push(options); return visibilities; },
    },
    sequelize: {
      transaction: async <T>(work: (transaction: any) => Promise<T>) => {
        const snapshots = allRows.map((row) => structuredClone(row.state));
        try {
          return await work({ LOCK: { UPDATE: "UPDATE" } });
        } catch (error) {
          allRows.forEach((row, index) => {
            Object.keys(row.state).forEach((key) => delete row.state[key]);
            Object.assign(row.state, snapshots[index]);
          });
          throw error;
        }
      },
    },
  };

  return {
    repository: new SequelizeServiceAggregateRepository(database as any),
    service,
    permissions,
    visibilities,
    lockCalls,
    failPermission: () => { failPermission = true; },
    failVisibility: () => { failVisibility = true; },
    failService: () => { failService = true; },
  };
};

const update = {
  service: { name: "FT atualizado", description: "Atualizado", url: "/ft" },
  permissions: [
    { id: 1, service_id: 6, role_id: 1, read: true, write: true, edit: false, del: false },
  ],
  visibility: [
    { id: 1, service_id: 6, setor_id: 1, visibility: true },
  ],
};

test("service aggregate repository updates atomically and returns snapshots", async () => {
  const fake = makeDatabase();
  const result = await fake.repository.update(6, update);

  assert.equal(result.before.services.name, "FT");
  assert.equal(result.before.permissions[0].write, false);
  assert.equal(result.after.services.name, "FT atualizado");
  assert.equal(result.after.permissions[0].write, true);
  assert.equal(result.after.visibility[0].visibility, true);
  assert.ok(fake.lockCalls.slice(0, 3).every((options: any) => options.lock === "UPDATE"));
});

test("service aggregate repository rolls back permission and visibility failures", async () => {
  const serviceFailure = makeDatabase();
  serviceFailure.failService();
  await assert.rejects(() => serviceFailure.repository.update(6, update));
  assert.equal(serviceFailure.service.state.name, "FT");

  const permissionFailure = makeDatabase();
  permissionFailure.failPermission();
  await assert.rejects(() => permissionFailure.repository.update(6, update));
  assert.equal(permissionFailure.service.state.name, "FT");
  assert.equal(permissionFailure.permissions[0].state.write, false);

  const visibilityFailure = makeDatabase();
  visibilityFailure.failVisibility();
  await assert.rejects(() => visibilityFailure.repository.update(6, update));
  assert.equal(visibilityFailure.service.state.name, "FT");
  assert.equal(visibilityFailure.permissions[0].state.write, false);
  assert.equal(visibilityFailure.visibilities[0].state.visibility, false);
});

test("service aggregate repository soft deletes inside its local transaction", async () => {
  const fake = makeDatabase();
  const result = await fake.repository.delete(6);
  assert.equal(result.before.services.id, 6);
  assert.equal(result.after, null);
  assert.ok(fake.service.state.deletedAt instanceof Date);
});
