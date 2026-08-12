import { Op } from "sequelize";
import db from "../../../infra/database/sequelize/index.js";
import AesCryptService from "../../../core/security/aes/AesCrypt.service.js";
import { ProtocolMailer } from "./protocol.mailer.js";

export type ProtocolNotificationRow = {
  id: number;
  attempts: number;
  encryptedRecipient: string;
  subject: string;
  payload: { text: string };
  update(values: Record<string, unknown>): Promise<unknown>;
};

export type ProtocolNotificationModelGateway = {
  findAll(options: unknown): Promise<ProtocolNotificationRow[]>;
  update(values: Record<string, unknown>, options: unknown): Promise<[number, ...unknown[]]>;
};

const notificationModel = () => db.sequelize.models.ProtocolNotificationModel as unknown as ProtocolNotificationModelGateway;

export class ProtocolNotificationWorker {
  constructor(private mailer: { sendNotification(to: string, subject: string, text: string): Promise<unknown> } = new ProtocolMailer(), private aes: Pick<AesCryptService, "decrypt"> = new AesCryptService(), private model: ProtocolNotificationModelGateway = notificationModel()) {}
  async runBatch(limit = 20): Promise<number> {
    const model = this.model; const rows = await model.findAll({ where: { status: { [Op.in]: ["PENDING", "FAILED"] }, nextAttemptAt: { [Op.lte]: new Date() }, attempts: { [Op.lt]: 5 } }, order: [["createdAt", "ASC"]], limit });
    for (const row of rows) {
      const [claimed] = await model.update({ status: "PROCESSING", attempts: row.attempts + 1 }, { where: { id: row.id, status: { [Op.in]: ["PENDING", "FAILED"] } } }); if (claimed !== 1) continue;
      try { const recipient = await this.aes.decrypt(row.encryptedRecipient); await this.mailer.sendNotification(recipient, row.subject, row.payload.text); await row.update({ status: "PROCESSED", processedAt: new Date(), lastError: null }); }
      catch (error) { const attempts = row.attempts + 1; await row.update({ status: "FAILED", attempts, lastError: error instanceof Error ? error.message.slice(0, 2000) : String(error).slice(0, 2000), nextAttemptAt: new Date(Date.now() + Math.min(3600000, 30000 * 2 ** attempts)) }); }
    }
    return rows.length;
  }
}

export function startProtocolNotificationWorker(logger: { error: (value: unknown) => void }) {
  const worker = new ProtocolNotificationWorker(); const execute = () => void worker.runBatch().catch((error) => logger.error(error)); execute(); const timer = setInterval(execute, 30000); timer.unref(); return () => clearInterval(timer);
}
