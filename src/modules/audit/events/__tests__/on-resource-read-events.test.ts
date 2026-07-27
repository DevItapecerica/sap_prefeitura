import assert from "node:assert/strict";
import test from "node:test";
import { ApplicationEventContext } from "../../../../core/event/application-event.js";
import { EventHandler } from "../../../../core/event/event-contracts.js";
import {
  ResourceExportedEvent,
  ResourceListedEvent,
  ResourceViewedEvent,
  RESOURCE_READ_EVENTS,
} from "../../../../core/event/resource-read.events.js";
import { RecordAuditDto } from "../../application/dto/audit.dto.js";
import { registerResourceReadAuditHandlers } from "../on-resource-read-events.js";

class FakeResourceReadSubscriber {
  listed?: EventHandler<ResourceListedEvent>;
  viewed?: EventHandler<ResourceViewedEvent>;
  exported?: EventHandler<ResourceExportedEvent>;

  subscribe(eventName: string, handler: EventHandler<any>) {
    const property = {
      [RESOURCE_READ_EVENTS.listed]: "listed",
      [RESOURCE_READ_EVENTS.viewed]: "viewed",
      [RESOURCE_READ_EVENTS.exported]: "exported",
    }[eventName] as "listed" | "viewed" | "exported";
    (this as any)[property] = handler;
    return () => {
      if ((this as any)[property] === handler) (this as any)[property] = undefined;
    };
  }
}

const context = (correlationId: string): ApplicationEventContext => ({
  correlationId,
  actor: { id: 9, name: "Admin", roleId: 1, setorId: 2 },
  origin: {
    type: "HTTP",
    ip: "127.0.0.1",
    method: "GET",
    route: "/resource",
  },
});

test("read events map to LIST, VIEW and EXPORT without snapshots", async () => {
  const events = new FakeResourceReadSubscriber();
  const records: RecordAuditDto[] = [];
  const unregister = registerResourceReadAuditHandlers(
    events,
    { record: async (input) => records.push(input) },
    { error() {} } as any,
  );

  try {
    await events.listed?.({
      context: context("list-request"),
      module: "user",
      resourceType: "user",
      filters: { page: 1 },
      returnedCount: 2,
    });
    await events.viewed?.({
      context: context("view-request"),
      module: "user",
      resourceType: "user",
      resourceId: "7",
    });
    await events.exported?.({
      context: context("export-request"),
      module: "ft-relatorio",
      resourceType: "relatorio",
      resourceId: "edital-1",
      filters: { mes: "2026-07" },
      returnedCount: 12,
    });

    assert.deepEqual(
      records.map((record) => record.action),
      ["LIST", "VIEW", "EXPORT"],
    );
    assert.equal(records[0]?.returnedCount, 2);
    assert.deepEqual(records[0]?.filters, { page: 1 });
    assert.equal(records[1]?.resourceId, "7");
    assert.equal(records[2]?.returnedCount, 12);
    for (const record of records) {
      assert.equal(record.before, undefined);
      assert.equal(record.after, undefined);
    }
  } finally {
    unregister();
  }

  assert.equal(events.listed, undefined);
  assert.equal(events.viewed, undefined);
  assert.equal(events.exported, undefined);
});

test("read audit failure is logged without throwing to the publisher", async () => {
  const events = new FakeResourceReadSubscriber();
  let logged = false;
  const unregister = registerResourceReadAuditHandlers(
    events,
    {
      record: async () => {
        throw new Error("outbox unavailable");
      },
    },
    {
      error() {
        logged = true;
      },
    } as any,
  );

  try {
    await events.viewed?.({
      context: context("failed-read"),
      module: "audit",
      resourceType: "audit",
      resourceId: "audit-1",
    });
    assert.equal(logged, true);
  } finally {
    unregister();
  }
});
