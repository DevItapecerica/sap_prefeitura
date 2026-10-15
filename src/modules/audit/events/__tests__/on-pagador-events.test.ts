import assert from "node:assert/strict";
import test from "node:test";
import { PAGADOR_EVENTS } from "../../../ft-pagador/application/pagador.events.js";
import { registerPagadorAuditHandlers } from "../on-pagador-events.js";

test("pagador events audit create, update and soft delete", async () => {
  const handlers = new Map<string, (event: any) => Promise<void>>();
  const records: any[] = [];
  const subscriber = {
    subscribe: (name: string, handler: (event: any) => Promise<void>) => {
      handlers.set(name, handler);
      return () => handlers.delete(name);
    },
  };
  const unregister = registerPagadorAuditHandlers(
    subscriber as any,
    { record: async (record: any) => { records.push(record); } },
    { error() {} } as any,
  );
  const context = { correlationId: "request-1", actor: { id: 1 }, origin: { type: "HTTP" } } as any;
  const before = { uuid: "p1", nome: "A", quantidade: 1 };
  const after = { ...before, quantidade: 2 };

  await handlers.get(PAGADOR_EVENTS.created)?.({ context, after: before });
  await handlers.get(PAGADOR_EVENTS.updated)?.({ context, before, after });
  await handlers.get(PAGADOR_EVENTS.deleted)?.({ context, before: after, resourceId: "p1" });

  assert.deepEqual(records.map((item) => item.action), ["CREATE", "UPDATE", "DELETE"]);
  assert.deepEqual(records.map((item) => item.resourceId), ["p1", "p1", "p1"]);
  assert.equal(records[2].after, null);
  unregister();
  assert.equal(handlers.size, 0);
});
