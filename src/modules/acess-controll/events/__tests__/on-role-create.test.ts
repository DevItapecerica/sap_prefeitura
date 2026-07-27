import assert from "node:assert/strict";
import test from "node:test";
import { EventHandler } from "../../../../core/event/event-contracts.js";
import { RoleCreatedEvent } from "../../../roles/application/events/role.events.js";
import { Roles } from "../../../roles/domain/entity/Role.js";
import { registerRoleCreatedHandler } from "../on-role-create.js";

class FakeSubscriber {
  created?: EventHandler<RoleCreatedEvent>;
  subscribe(_eventName: string, handler: EventHandler<any>) {
    this.created = handler;
    return () => { if (this.created === handler) this.created = undefined; };
  }
}

test("role created handler creates defaults and unsubscribes", async () => {
  const events = new FakeSubscriber();
  const received: Roles[] = [];
  const unsubscribe = registerRoleCreatedHandler(
    events,
    { ensureForRole: async (role: Roles) => { received.push(role); } } as any,
    { error: () => undefined } as any,
  );
  const role = new Roles(3, "Gestor");
  await events.created?.({ context: { correlationId: "role-1" }, role });
  assert.deepEqual(received, [role]);
  unsubscribe();
  assert.equal(events.created, undefined);
});

test("role created handler contains access default failures", async () => {
  const events = new FakeSubscriber();
  const errors: unknown[] = [];
  registerRoleCreatedHandler(
    events,
    { ensureForRole: async () => { throw new Error("offline"); } } as any,
    { error: (input: unknown) => { errors.push(input); } } as any,
  );
  await assert.doesNotReject(async () => events.created!({
    context: { correlationId: "role-2" },
    role: new Roles(3, "Gestor"),
  }));
  assert.equal(errors.length, 1);
});
