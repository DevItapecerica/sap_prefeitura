import { col, fn, Op } from "sequelize";
import {
  PROTOCOL_ALERT_FAILED_NOTIFICATIONS_THRESHOLD,
  PROTOCOL_ALERT_OPEN_PRIVACY_DAYS,
  PROTOCOL_ALERT_OVERDUE_THRESHOLD,
} from "../../../core/env.js";
import { protocolModels } from "../infra/protocol-model-registry.js";

type GroupedCount = Record<string, number>;
type OperationsRepository = {
  protocolsBy(field: "state" | "protocolType"): Promise<GroupedCount>;
  countOverdue(now: Date): Promise<number>;
  countNotifications(status: string): Promise<number>;
  countPrivacyOpen(): Promise<number>;
  oldestPrivacyOpen(): Promise<Date | null>;
  countAttachments(status: string): Promise<number>;
};

class SequelizeProtocolOperationsRepository implements OperationsRepository {
  async protocolsBy(field: "state" | "protocolType") {
    const rows = await protocolModels().ProtocolModel.findAll({ attributes: [field, [fn("COUNT", col("id")), "count"]], group: [field], raw: true }) as unknown as Array<Record<typeof field | "count", string | number>>;
    return Object.fromEntries(rows.map((row) => [String(row[field]), Number(row.count)]));
  }
  countOverdue(now: Date) { return protocolModels().ProtocolModel.count({ where: { dueAt: { [Op.lt]: now }, state: { [Op.notIn]: ["CONCLUIDO", "INDEFERIDO", "CANCELADO"] } } }); }
  countNotifications(status: string) { return protocolModels().ProtocolNotificationModel.count({ where: { status } }); }
  countPrivacyOpen() { return protocolModels().ProtocolPrivacyRequestModel.count({ where: { status: { [Op.notIn]: ["FULFILLED", "DENIED"] } } }); }
  async oldestPrivacyOpen() {
    const value = await protocolModels().ProtocolPrivacyRequestModel.min("createdAt", { where: { status: { [Op.notIn]: ["FULFILLED", "DENIED"] } } });
    return value instanceof Date ? value : value != null ? new Date(String(value)) : null;
  }
  countAttachments(status: string) { return protocolModels().ProtocolAttachmentModel.count({ where: { status } }); }
}

export class ProtocolOperationsService {
  constructor(private readonly repository: OperationsRepository = new SequelizeProtocolOperationsRepository()) {}

  async snapshot(now = new Date()) {
    const [byState, byType, overdue, pendingNotifications, failedNotifications, openPrivacyRequests, oldestPrivacyRequestAt, quarantinedAttachments, rejectedAttachments] = await Promise.all([
      this.repository.protocolsBy("state"), this.repository.protocolsBy("protocolType"), this.repository.countOverdue(now),
      this.repository.countNotifications("PENDING"), this.repository.countNotifications("FAILED"), this.repository.countPrivacyOpen(),
      this.repository.oldestPrivacyOpen(), this.repository.countAttachments("QUARANTINED"), this.repository.countAttachments("REJECTED"),
    ]);
    const oldestPrivacyAgeDays = oldestPrivacyRequestAt ? Math.floor((now.getTime() - oldestPrivacyRequestAt.getTime()) / 86_400_000) : null;
    const alerts: Array<{ code: string; severity: "WARNING" | "CRITICAL"; value: number; threshold: number }> = [];
    if (overdue >= PROTOCOL_ALERT_OVERDUE_THRESHOLD) alerts.push({ code: "PROTOCOL_OVERDUE", severity: "WARNING", value: overdue, threshold: PROTOCOL_ALERT_OVERDUE_THRESHOLD });
    if (failedNotifications >= PROTOCOL_ALERT_FAILED_NOTIFICATIONS_THRESHOLD) alerts.push({ code: "PROTOCOL_NOTIFICATION_FAILURE", severity: "CRITICAL", value: failedNotifications, threshold: PROTOCOL_ALERT_FAILED_NOTIFICATIONS_THRESHOLD });
    if (oldestPrivacyAgeDays !== null && oldestPrivacyAgeDays >= PROTOCOL_ALERT_OPEN_PRIVACY_DAYS) alerts.push({ code: "PROTOCOL_PRIVACY_REQUEST_AGED", severity: "CRITICAL", value: oldestPrivacyAgeDays, threshold: PROTOCOL_ALERT_OPEN_PRIVACY_DAYS });
    if (quarantinedAttachments > 0) alerts.push({ code: "PROTOCOL_ATTACHMENT_STUCK", severity: "CRITICAL", value: quarantinedAttachments, threshold: 1 });
    return {
      generatedAt: now,
      protocols: { byState, byType, overdue },
      notifications: { pending: pendingNotifications, failed: failedNotifications },
      privacy: { open: openPrivacyRequests, oldestOpenAt: oldestPrivacyRequestAt, oldestOpenAgeDays: oldestPrivacyAgeDays },
      attachments: { quarantined: quarantinedAttachments, rejected: rejectedAttachments },
      alerts,
    };
  }
}
