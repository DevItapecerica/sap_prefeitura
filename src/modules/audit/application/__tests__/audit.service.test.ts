import assert from "node:assert/strict";
import test from "node:test";
import { IAesCrypt } from "../../../../core/security/aes/AesCrypt.interface.js";
import { StoredAuditEvent } from "../../domain/entity/AuditEvent.js";
import AuditRepository from "../../domain/repository/audit.repository.js";
import { AuditOutboxItemDto, AuditQueryDto } from "../dto/audit.dto.js";
import { AuditMapper } from "../mapper/audit.mapper.js";
import { AuditService } from "../use-case/audit.service.js";
import { AuditWorkerService } from "../use-case/audit-worker.service.js";

class FakeCrypt implements IAesCrypt {
  encrypt(text: string) { return Promise.resolve(`encrypted:${text}`); }
  decrypt(text: string) { return Promise.resolve(text.replace(/^encrypted:/, "")); }
}

class FakeAuditRepository implements AuditRepository {
  enqueued: StoredAuditEvent[] = [];
  items: AuditOutboxItemDto[] = [];
  persisted: AuditOutboxItemDto[] = [];
  failures: Array<{ item: AuditOutboxItemDto; next: Date }> = [];
  purgeBefore?: Date;
  failPersist = false;
  detailRow: Record<string, any> | null = null;
  enqueue(event: StoredAuditEvent) { this.enqueued.push(event); return Promise.resolve(); }
  claimBatch() { return Promise.resolve(this.items); }
  async persist(item: AuditOutboxItemDto) { if (this.failPersist) throw new Error("offline"); this.persisted.push(item); }
  markFailed(item: AuditOutboxItemDto, _error: unknown, next: Date) { this.failures.push({ item, next }); return Promise.resolve(); }
  backlog() { return Promise.resolve(this.items.length); }
  list(_query: AuditQueryDto) { return Promise.resolve({ rows: [{ id: 1 }], count: 1 }); }
  detail() { return Promise.resolve(this.detailRow); }
  export(_query: AuditQueryDto) { return Promise.resolve([{ id: 1 }]); }
  purge(before: Date) { this.purgeBefore = before; return Promise.resolve(2); }
}

test("AuditService sanitizes and encrypts snapshots before enqueue", async () => {
  const repository = new FakeAuditRepository();
  const service = new AuditService(repository, new AuditMapper(new FakeCrypt()));
  await service.record({ actor: {}, action: "UPDATE", module: "user", resourceType: "user", result: "SUCCESS", before: { name: "A", password: "secret" } });
  const payload = repository.enqueued[0];
  assert.ok(payload?.beforeEncrypted?.startsWith("encrypted:"));
  assert.equal(payload?.beforeEncrypted?.includes("secret"), false);
  assert.equal("before" in (payload || {}), false);
});

test("AuditService lists, decrypts detail and exports through repository", async () => {
  const repository = new FakeAuditRepository();
  repository.detailRow = { id: 1, beforeEncrypted: 'encrypted:{"name":"A"}', afterEncrypted: null, metadataEncrypted: null };
  const service = new AuditService(repository, new AuditMapper(new FakeCrypt()));
  assert.equal((await service.list({})).count, 1);
  assert.deepEqual((await service.detail("1")).before, { name: "A" });
  assert.equal((await service.export({})).length, 1);
});

test("AuditWorkerService processes items, records failures and purges retention", async () => {
  const repository = new FakeAuditRepository();
  const item = { id: 1, eventId: "e1", payload: "{}", attempts: 0 };
  repository.items = [item];
  const worker = new AuditWorkerService(repository);
  assert.equal((await worker.run(new Date("2026-07-15T12:00:00Z"))).processed, 1);
  repository.failPersist = true;
  assert.equal((await worker.run(new Date("2026-07-15T12:00:00Z"))).failed, 1);
  assert.equal(repository.failures.length, 1);
  await worker.purge(new Date("2026-07-15T12:00:00Z"), 5);
  assert.equal(repository.purgeBefore?.toISOString(), "2021-07-15T12:00:00.000Z");
});
