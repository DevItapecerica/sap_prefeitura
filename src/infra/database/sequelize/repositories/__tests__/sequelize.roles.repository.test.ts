import assert from "node:assert/strict";
import test from "node:test";
import { SequelizeRolesRepository } from "../sequelize.roles.repository.js";

class FakeRow {
  deleted = false;
  constructor(readonly state: Record<string, unknown>) {}
  get(key: string) { return this.state[key]; }
  async update(input: Record<string, unknown>) { Object.assign(this.state, input); return this; }
  async destroy() { this.deleted = true; return this; }
}

const makeDatabase = () => {
  const role = new FakeRow({ id: 2, name: "Gestor" });
  let permissionRows = [
    new FakeRow({ id: 10, role_id: 2, service_id: 6, read: true, write: false, edit: false, del: false }),
  ];
  let hasUser = false;
  let failPermissionDelete = false;
  let failRoleDelete = false;
  const lockCalls: unknown[] = [];

  const database = {
    RolesModel: {
      findByPk: async (id: number, options?: object) => {
        if (options) lockCalls.push(options);
        return id === 2 && !role.deleted ? role : null;
      },
    },
    UserModel: {
      findOne: async (options: object) => {
        lockCalls.push(options);
        return hasUser ? new FakeRow({ id: 7 }) : null;
      },
    },
    PermissionsModel: {
      findAll: async (options: object) => { lockCalls.push(options); return permissionRows; },
      destroy: async () => {
        if (failPermissionDelete) throw new Error("permission delete failed");
        permissionRows = [];
        return 1;
      },
    },
    sequelize: {
      transaction: async <T>(work: (transaction: any) => Promise<T>) => {
        const roleDeleted = role.deleted;
        const permissionsSnapshot = [...permissionRows];
        const originalDestroy = role.destroy.bind(role);
        role.destroy = async () => {
          if (failRoleDelete) throw new Error("role delete failed");
          return originalDestroy();
        };
        try {
          return await work({ LOCK: { UPDATE: "UPDATE" } });
        } catch (error) {
          role.deleted = roleDeleted;
          permissionRows = permissionsSnapshot;
          throw error;
        }
      },
    },
  };

  return {
    repository: new SequelizeRolesRepository(database as any),
    role,
    permissions: () => permissionRows,
    lockCalls,
    setUser: () => { hasUser = true; },
    failPermissions: () => { failPermissionDelete = true; },
    failRole: () => { failRoleDelete = true; },
  };
};

test("roles repository deletes permissions and role atomically", async () => {
  const fake = makeDatabase();
  const result = await fake.repository.deleteWithPermissions(2);
  assert.equal(result.status, "deleted");
  if (result.status === "deleted") {
    assert.equal(result.before.role.name, "Gestor");
    assert.equal(result.before.permissions.length, 1);
  }
  assert.equal(fake.permissions().length, 0);
  assert.equal(fake.role.deleted, true);
  assert.ok(fake.lockCalls.every((options: any) => options.lock === "UPDATE"));
});

test("roles repository blocks deletion when the role has users", async () => {
  const fake = makeDatabase();
  fake.setUser();
  assert.deepEqual(await fake.repository.deleteWithPermissions(2), { status: "in_use" });
  assert.equal((fake.lockCalls[1] as any).paranoid, false);
  assert.equal(fake.permissions().length, 1);
  assert.equal(fake.role.deleted, false);
});

test("roles repository rolls back failures while deleting the aggregate", async () => {
  const permissionFailure = makeDatabase();
  permissionFailure.failPermissions();
  await assert.rejects(() => permissionFailure.repository.deleteWithPermissions(2));
  assert.equal(permissionFailure.permissions().length, 1);
  assert.equal(permissionFailure.role.deleted, false);

  const roleFailure = makeDatabase();
  roleFailure.failRole();
  await assert.rejects(() => roleFailure.repository.deleteWithPermissions(2));
  assert.equal(roleFailure.permissions().length, 1);
  assert.equal(roleFailure.role.deleted, false);
});
