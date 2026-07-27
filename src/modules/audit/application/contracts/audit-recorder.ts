import { RecordAuditDto } from "../dto/audit.dto.js";

export interface AuditRecorder {
  record(input: RecordAuditDto): Promise<unknown>;
}
