import assert from "node:assert/strict";
import test from "node:test";
import { Permissions } from "../../../permission/domain/entity/Permission.js";
import { PermissionEventHandler, PermissionEventSubscriber } from "../../../permission/application/events/permission-event-bus.js";
import { PermissionUpdatedEvent } from "../../../permission/application/events/permission.events.js";
import { RoleEventHandler, RoleEventSubscriber } from "../../../roles/application/events/role-event-bus.js";
import { RoleCreatedEvent, RoleDeletedEvent, RoleUpdatedEvent } from "../../../roles/application/events/role.events.js";
import { Roles } from "../../../roles/domain/entity/Role.js";
import { RecordAuditDto } from "../../application/dto/audit.dto.js";
import { consumeAuditRequestHandled } from "../audit-request-registry.js";
import { registerPermissionAuditHandlers } from "../on-permission-events.js";
import { registerRoleAuditHandlers } from "../on-role-events.js";

class FakeRoleSubscriber implements RoleEventSubscriber {
  created?: RoleEventHandler<RoleCreatedEvent>;
  updated?: RoleEventHandler<RoleUpdatedEvent>;
  deleted?: RoleEventHandler<RoleDeletedEvent>;
  onCreated(handler: RoleEventHandler<RoleCreatedEvent>) { this.created = handler; return () => { this.created = undefined; }; }
  onUpdated(handler: RoleEventHandler<RoleUpdatedEvent>) { this.updated = handler; return () => { this.updated = undefined; }; }
  onDeleted(handler: RoleEventHandler<RoleDeletedEvent>) { this.deleted = handler; return () => { this.deleted = undefined; }; }
}

class FakePermissionSubscriber implements PermissionEventSubscriber {
  updated?: PermissionEventHandler<PermissionUpdatedEvent>;
  onUpdated(handler: PermissionEventHandler<PermissionUpdatedEvent>) { this.updated = handler; return () => { this.updated = undefined; }; }
}

const context = (correlationId: string) => ({
  correlationId,
  actor: { id: 1, name: "Admin", roleId: 1, setorId: 1 },
  origin: { type: "HTTP" as const, method: "PUT", route: "/resource/:id" },
});

test("role and permission events create complete audit snapshots", async () => {
  const roleEvents = new FakeRoleSubscriber();
  const permissionEvents = new FakePermissionSubscriber();
  const records: RecordAuditDto[] = [];
  const recorder = { record: async (input: RecordAuditDto) => { records.push(input); } };
  const logger = { error() {} } as any;
  const unregisterRole = registerRoleAuditHandlers(roleEvents, recorder, logger);
  const unregisterPermission = registerPermissionAuditHandlers(permissionEvents, recorder, logger);
  const beforeRole = new Roles(2, "Gestor");
  const afterRole = new Roles(2, "Operador");
  const beforePermission = new Permissions(6, 2, true, false, false, false, 10);
  const afterPermission = new Permissions(6, 2, true, true, false, false, 10);

  try {
    await roleEvents.created?.({ context: context("role-create"), role: beforeRole });
    await roleEvents.updated?.({ context: context("role-update"), before: beforeRole, after: afterRole });
    await roleEvents.deleted?.({ context: context("role-delete"), before: { role: afterRole, permissions: [afterPermission] } });
    await permissionEvents.updated?.({ context: context("permission-update"), before: beforePermission, after: afterPermission });
    assert.deepEqual(records.map((record) => record.action), ["CREATE", "UPDATE", "DELETE", "UPDATE"]);
    assert.equal((records[2].before as any).permissions.length, 1);
    assert.equal(records[3].before, beforePermission);
    assert.equal(records[3].after, afterPermission);
    assert.equal(consumeAuditRequestHandled("permission-update"), true);
  } finally {
    unregisterRole();
    unregisterPermission();
    ["role-create", "role-update", "role-delete"].forEach(consumeAuditRequestHandled);
  }
});

test("failed role and permission audit keeps hook fallback available", async () => {
  const roleEvents = new FakeRoleSubscriber();
  const permissionEvents = new FakePermissionSubscriber();
  let errors = 0;
  const recorder = { record: async () => { throw new Error("outbox unavailable"); } };
  const logger = { error() { errors += 1; } } as any;
  registerRoleAuditHandlers(roleEvents, recorder, logger);
  registerPermissionAuditHandlers(permissionEvents, recorder, logger);
  const role = new Roles(2, "Gestor");
  const permission = new Permissions(6, 2, true, false, false, false, 10);
  await roleEvents.created?.({ context: context("failed-role"), role });
  await permissionEvents.updated?.({ context: context("failed-permission"), before: permission, after: permission });
  assert.equal(errors, 2);
  assert.equal(consumeAuditRequestHandled("failed-role"), false);
  assert.equal(consumeAuditRequestHandled("failed-permission"), false);
});
