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

const makeDatabase = (description: string | null = "PEEAD") => {
  let failPermission = false;
  let failVisibility = false;
  let failService = false;
  const service = new FakeRow({
    id: 6,
    name: "FT",
    description,
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
  visibility: [
    { id: 1, service_id: 6, setor_id: 1, visibility: true },
  ],
};

test("service aggregate repository updates atomically and returns snapshots", async () => {
  const fake = makeDatabase();
  const result = await fake.repository.update(6, update);

  assert.equal(result.before.services.name, "FT");
  assert.deepEqual(result.before.permissions, []);
  assert.equal(result.after.services.name, "FT atualizado");
  assert.deepEqual(result.after.permissions, []);
  assert.equal(result.after.visibility[0].visibility, true);
  assert.ok(fake.lockCalls.slice(0, 2).every((options: any) => options.lock === "UPDATE"));
});

test("service aggregate repository preserves plain-text descriptions", async () => {
  const description = "Atendimento à população, com \"prioridade\".\nSegunda linha.";
  const fake = makeDatabase(description);

  const loaded = await fake.repository.findById(6);

  assert.equal(loaded?.services.description, description);
});

test("service aggregate repository preserves null descriptions", async () => {
  const fake = makeDatabase(null);

  const loaded = await fake.repository.findById(6);

  assert.equal(loaded?.services.description, null);
});

test("service aggregate repository keeps descriptions unchanged across updates", async () => {
  const description = "Atendimento à população, com \"prioridade\".\nSegunda linha.";
  const fake = makeDatabase(description);
  const unchangedDescriptionUpdate = {
    ...update,
    service: { ...update.service, description },
  };

  const firstUpdate = await fake.repository.update(6, unchangedDescriptionUpdate);
  const secondUpdate = await fake.repository.update(6, unchangedDescriptionUpdate);

  assert.equal(firstUpdate.before.services.description, description);
  assert.equal(firstUpdate.after.services.description, description);
  assert.equal(secondUpdate.before.services.description, description);
  assert.equal(secondUpdate.after.services.description, description);
  assert.equal(fake.service.state.description, description);
});

test("service aggregate repository rolls back permission and visibility failures", async () => {
  const serviceFailure = makeDatabase();
  serviceFailure.failService();
  await assert.rejects(() => serviceFailure.repository.update(6, update));
  assert.equal(serviceFailure.service.state.name, "FT");

  const visibilityFailure = makeDatabase();
  visibilityFailure.failVisibility();
  await assert.rejects(() => visibilityFailure.repository.update(6, update));
  assert.equal(visibilityFailure.service.state.name, "FT");
  assert.equal(visibilityFailure.permissions[0].state.write, false);
  assert.equal(visibilityFailure.visibilities[0].state.visibility, false);
});

test("service aggregate refuses legacy grant writes without touching preserved data", async () => {
 const fake = makeDatabase();
 await assert.rejects(fake.repository.update(6, {...update, permissions: []} as any));
 assert.equal(fake.service.state.name, "FT");
 assert.equal(fake.permissions[0].state.write, false);
});
