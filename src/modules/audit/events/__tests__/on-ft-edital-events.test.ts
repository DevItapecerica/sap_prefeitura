import assert from "node:assert/strict";
import test from "node:test";
import { FT_EDITAL_EVENTS } from "../../../ft-edital/application/events/ft-edital.events.js";
import { registerFtEditalAuditHandlers } from "../on-ft-edital-events.js";

test("edicao de vinculo registra local e pagador antes e depois", async () => {
  const handlers = new Map<string, (event: any) => Promise<void>>();
  const records: any[] = [];
  const subscriber = {
    subscribe: (name: string, handler: (event: any) => Promise<void>) => {
      handlers.set(name, handler);
      return () => handlers.delete(name);
    },
  };
  const unregister = registerFtEditalAuditHandlers(
    subscriber as any,
    { record: async (record: any) => { records.push(record); } },
    { error() {} } as any,
  );
  const before = { id: "v1", local: "Secretaria", pagador_id: "p1" };
  const after = { id: "v1", local: "CRAS", pagador_id: "p2" };

  await handlers.get(FT_EDITAL_EVENTS.vinculoUpdated)?.({
    context: { correlationId: "request-1", actor: { id: 1 }, origin: { type: "HTTP" } },
    editalId: "e1",
    bolsistaId: "b1",
    before,
    after,
  });

  assert.equal(records[0].action, "UPDATE");
  assert.equal(records[0].resourceId, "e1:b1");
  assert.deepEqual(records[0].before, before);
  assert.deepEqual(records[0].after, after);
  unregister();
  assert.equal(handlers.size, 0);
});

test("transicoes automaticas registram conclusao e expiracao", async () => {
  const handlers = new Map<string, (event: any) => Promise<void>>();
  const records: any[] = [];
  const unregister = registerFtEditalAuditHandlers(
    {
      subscribe: (name: string, handler: (event: any) => Promise<void>) => {
        handlers.set(name, handler);
        return () => handlers.delete(name);
      },
    } as any,
    { record: async (record: any) => records.push(record) },
    { error() {} } as any,
  );

  await handlers.get(FT_EDITAL_EVENTS.editalConcluded)?.({
    context: {
      correlationId: "scheduler-1",
      actor: { id: "system" },
      origin: { type: "SCHEDULER", route: "ft-scheduler" },
    },
    editalId: "e1",
    before: { status: "ativo" },
    after: { status: "inativo" },
    vinculos: [{ status: "concluido" }],
  });
  await handlers.get(FT_EDITAL_EVENTS.vinculoExpired)?.({
    context: {
      correlationId: "scheduler-2",
      actor: { id: "system" },
      origin: { type: "SCHEDULER", route: "ft-scheduler" },
    },
    editalId: "e1",
    bolsistaId: "b1",
    vinculoId: "v1",
    before: { status: "ativo" },
    after: { status: "expirado" },
  });

  assert.deepEqual(records.map((record) => record.resourceType), [
    "edital",
    "edital_bolsista",
  ]);
  assert.equal(records[0].metadata.automatic, true);
  assert.equal(records[1].metadata.vinculoId, "v1");
  unregister();
});
