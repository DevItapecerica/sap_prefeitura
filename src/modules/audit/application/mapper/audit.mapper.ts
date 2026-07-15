import { IAesCrypt } from "../../../../core/security/aes/AesCrypt.interface.js";
import { StoredAuditEvent } from "../../domain/entity/AuditEvent.js";
import { RecordAuditDto } from "../dto/audit.dto.js";
import { sanitizeAuditValue } from "../utils/audit-sanitizer.js";

export class AuditMapper {
  constructor(private crypt: IAesCrypt) {}

  async toPersistence(input: RecordAuditDto & { eventId: string; occurredAt: string }): Promise<StoredAuditEvent> {
    const encrypt = async (value: unknown) => value === undefined ? null : this.crypt.encrypt(JSON.stringify(sanitizeAuditValue(value)));
    return {
      eventId: input.eventId, occurredAt: input.occurredAt, actor: input.actor,
      action: input.action, module: input.module, resourceType: input.resourceType,
      resourceId: input.resourceId ?? null, result: input.result, errorCode: input.errorCode ?? null,
      requestId: input.requestId ?? null, ip: input.ip ?? null, method: input.method ?? null,
      route: input.route ?? null, filters: sanitizeAuditValue(input.filters), returnedCount: input.returnedCount ?? null,
      beforeEncrypted: await encrypt(input.before), afterEncrypted: await encrypt(input.after),
      metadataEncrypted: await encrypt(input.metadata),
    };
  }

  async toDetail(row: Record<string, any>): Promise<Record<string, any>> {
    const decrypt = async (value?: string | null) => value ? JSON.parse(await this.crypt.decrypt(value)) : null;
    const result: Record<string, any> = { ...row, before: await decrypt(row.beforeEncrypted), after: await decrypt(row.afterEncrypted), metadata: await decrypt(row.metadataEncrypted) };
    delete result.beforeEncrypted; delete result.afterEncrypted; delete result.metadataEncrypted;
    return result;
  }
}
