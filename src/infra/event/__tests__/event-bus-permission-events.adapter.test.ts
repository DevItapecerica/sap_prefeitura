import assert from "node:assert/strict";
import test from "node:test";
import { Permissions } from "../../../modules/permission/domain/entity/Permission.js";
import { EventBusPermissionEventsAdapter } from "../event-bus-permission-events.adapter.js";

test("EventBusPermissionEventsAdapter publishes and unsubscribes typed events", async () => {
  const adapter = new EventBusPermissionEventsAdapter();
  const received: number[] = [];
  const context = { correlationId: "request-1", origin: { type: "SYSTEM" as const } };
  const before = new Permissions(6, 2, true, false, false, false, 10);
  const after = new Permissions(6, 2, true, true, false, false, 10);
  const unsubscribe = adapter.onUpdated((event) => { received.push(event.after.id!); });
  await adapter.publishUpdated({ context, before, after });
  assert.deepEqual(received, [10]);
  unsubscribe();
  await adapter.publishUpdated({ context, before, after });
  assert.equal(received.length, 1);
});
