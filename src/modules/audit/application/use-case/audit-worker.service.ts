import AuditRepository from "../../domain/repository/audit.repository.js";

export type AuditWorkerResult = { processed: number; failed: number; backlog: number };

export class AuditWorkerService {
  constructor(private repository: AuditRepository) {}

  async run(now = new Date(), batchSize = 50): Promise<AuditWorkerResult> {
    const staleBefore = new Date(now.getTime() - 5 * 60_000);
    const items = await this.repository.claimBatch(now, staleBefore, batchSize);
    let processed = 0; let failed = 0;
    for (const item of items) {
      try { await this.repository.persist(item); processed += 1; }
      catch (error) {
        failed += 1;
        const attempts = item.attempts + 1;
        const delay = Math.min(60 * 60_000, 1_000 * 2 ** Math.min(attempts, 12));
        await this.repository.markFailed(item, error, new Date(now.getTime() + delay));
      }
    }
    return { processed, failed, backlog: await this.repository.backlog() };
  }

  purge(now = new Date(), retentionYears = 5): Promise<number> {
    const cutoff = new Date(now);
    cutoff.setUTCFullYear(cutoff.getUTCFullYear() - retentionYears);
    return this.repository.purge(cutoff);
  }
}
