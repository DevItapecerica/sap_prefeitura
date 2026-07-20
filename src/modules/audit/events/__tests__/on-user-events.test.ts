import assert from "node:assert/strict";
import test from "node:test";
import { ApplicationEventContext } from "../../../../core/event/application-event.js";
import {
  UserCreatedEvent,
  UserDeletedEvent,
  UserEventHandler,
  UserEventSubscriber,
  UserPasswordChangedEvent,
  UserUpdatedEvent,
} from "../../../user/application/events/user.events.js";
import { User } from "../../../user/domain/entity/User.js";
import { RecordAuditDto } from "../../application/dto/audit.dto.js";
import { consumeAuditRequestHandled } from "../audit-request-registry.js";
import { registerUserAuditHandlers } from "../on-user-events.js";

class FakeUserEventSubscriber implements UserEventSubscriber {
  created?: UserEventHandler<UserCreatedEvent>;
  updated?: UserEventHandler<UserUpdatedEvent>;
  deleted?: UserEventHandler<UserDeletedEvent>;
  passwordChanged?: UserEventHandler<UserPasswordChangedEvent>;

  onCreated(handler: UserEventHandler<UserCreatedEvent>) {
    this.created = handler;
    return () => { if (this.created === handler) this.created = undefined; };
  }
  onUpdated(handler: UserEventHandler<UserUpdatedEvent>) {
    this.updated = handler;
    return () => { if (this.updated === handler) this.updated = undefined; };
  }
  onDeleted(handler: UserEventHandler<UserDeletedEvent>) {
    this.deleted = handler;
    return () => { if (this.deleted === handler) this.deleted = undefined; };
  }
  onPasswordChanged(handler: UserEventHandler<UserPasswordChangedEvent>) {
    this.passwordChanged = handler;
    return () => {
      if (this.passwordChanged === handler) this.passwordChanged = undefined;
    };
  }
}

const context = (id: string): ApplicationEventContext => ({
  correlationId: id,
  actor: { id: 9, name: "Admin", roleId: 1, setorId: 2 },
  origin: {
    type: "HTTP",
    ip: "127.0.0.1",
    method: "PUT",
    route: "/user/:id",
  },
});

test("user events are translated into audit records with before and after", async () => {
  const events = new FakeUserEventSubscriber();
  const records: RecordAuditDto[] = [];
  const unregister = registerUserAuditHandlers(
    events,
    { record: async (input) => records.push(input) },
    { error() {} } as any,
  );
  const before = new User("Antes", "antes@itapecerica.sp.gov.br", null, 1, 2, 7);
  const after = new User("Depois", "depois@itapecerica.sp.gov.br", null, 2, 3, 7);

  try {
    await events.created?.({ context: context("create-request"), user: after });
    await events.updated?.({ context: context("update-request"), before, after });
    await events.deleted?.({ context: context("delete-request"), before: after });
    await events.passwordChanged?.({
      context: context("password-request"),
      userId: 7,
    });

    assert.deepEqual(records.map((record) => record.action), [
      "CREATE",
      "UPDATE",
      "DELETE",
      "PASSWORD_CHANGED",
    ]);
    assert.equal(records[0]?.before, null);
    assert.equal(records[0]?.after, after);
    assert.equal(records[1]?.before, before);
    assert.equal(records[1]?.after, after);
    assert.equal(records[2]?.before, after);
    assert.equal(records[2]?.after, null);
    assert.equal(records[3]?.before, undefined);
    assert.equal(records[3]?.after, undefined);
    assert.equal(records[3]?.metadata, undefined);
    assert.equal(consumeAuditRequestHandled("update-request"), true);
  } finally {
    unregister();
    consumeAuditRequestHandled("create-request");
    consumeAuditRequestHandled("delete-request");
    consumeAuditRequestHandled("password-request");
  }
});

test("failed audit listener leaves the HTTP hook fallback available", async () => {
  const events = new FakeUserEventSubscriber();
  let logged = false;
  const unregister = registerUserAuditHandlers(
    events,
    { record: async () => { throw new Error("outbox unavailable"); } },
    { error() { logged = true; } } as any,
  );

  try {
    await events.passwordChanged?.({
      context: context("failed-request"),
      userId: 7,
    });
    assert.equal(logged, true);
    assert.equal(consumeAuditRequestHandled("failed-request"), false);
  } finally {
    unregister();
  }
});
