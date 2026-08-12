import type { ProtocolCapabilities } from "../domain/protocol-capability.js";
import type { ProtocolState } from "../domain/protocolo.js";
import type { FormField } from "../domain/protocolo.js";
import type { ProtocolType } from "../domain/protocol-type.js";
import type { Transaction } from "sequelize";
import db from "../../../infra/database/sequelize/index.js";

type PlainRow<T> = T & {
  get(options: { plain: true }): T;
  save(options?: unknown): Promise<PlainRow<T>>;
  update(values: Record<string, unknown>, options?: unknown): Promise<PlainRow<T>>;
  increment(field: string): Promise<PlainRow<T>>;
  toJSON(): T;
};

export type ProtocolPersistenceRow = PlainRow<{
  id: string;
  publicNumber: string;
  citizenId: string;
  state: ProtocolState;
  currentSectorId: number | null;
  assigneeId: number | null;
  confidentiality: "NORMAL" | "RESTRICTED";
  legalHoldAt: Date | null;
  retentionReviewAt: Date | null;
  encryptedLegalHoldReason: string | null;
  contactEmail: string;
  contactEmailHash?: string;
  authenticityCode: string;
  protocolType: ProtocolType;
  subject: string;
  createdAt: Date;
  dueAt: Date;
  service?: { name: string };
  attachments?: ProtocolAttachmentRow[];
  movements?: Array<{ id: number; toState: string; internalMessage?: string | null }>;
  requirements?: ProtocolRequirementRow[];
  updatedAt: Date;
  privacyRequests?: Array<{ status: string }>;
}>;
type ProtocolPersistenceData = ProtocolPersistenceRow extends PlainRow<infer Data> ? Data : never;
export type ProtocolDetailData = Omit<ProtocolPersistenceData, "movements" | "requirements" | "attachments"> & {
  movements: Array<{ id: number; toState: string; internalMessage?: string | null }>;
  requirements: ProtocolRequirementRow[];
  attachments: ProtocolAttachmentRow[];
};
export type ProtocolDetailRow = Omit<ProtocolPersistenceRow, "movements" | "requirements" | "attachments" | "toJSON"> & ProtocolDetailData & {
  toJSON(): ProtocolDetailData;
};

export type ProtocolPrivacyRequestRow = PlainRow<{
  id: string;
  citizenId: string;
  protocolId: string | null;
  requestType: string;
  encryptedDetails: string;
  status: string;
  encryptedResponse: string | null;
  handledBy: number | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}>;

export type ProtocolPermissionRow = PlainRow<ProtocolCapabilities & { id: number; roleId: number }>;
export type ProtocolRoleRow = PlainRow<{ id: number; name: string }>;
export type ProtocolAttachmentRow = PlainRow<{
  id: string;
  protocolId: string;
  requirementId: string | null;
  originalName: string;
  storageKey: string;
  mimeType: string;
  size: number;
  sha256: string;
  status: "QUARANTINED" | "AVAILABLE" | "REJECTED";
}>;
export type ProtocolRequirementRow = PlainRow<{ id: string; protocolId: string; response: string | null; resolvedAt: Date | null }>;
export type ProtocolServiceRow = PlainRow<{
  id: number; name: string; description: string; active: boolean; publishedFormId: number | null;
  protocolType: ProtocolType; defaultSectorId: number | null; deadlineDays: number; forms?: ProtocolFormRow[];
}>;
export type ProtocolFormRow = PlainRow<{ id: number; serviceId: number; version: number; fields: FormField[]; publishedAt: Date | null }>;
export type ProtocolAccessCodeRow = PlainRow<{
  id: string; cpfHash: string; emailHash: string; codeHash: string; attempts: number; expiresAt: Date; usedAt: Date | null;
}>;
export type ProtocolMovementRow = PlainRow<{ id: number }>;
export type ProtocolCounterRow = PlainRow<{ year: number; value: number }>;
export type ProtocolMunicipeRow = PlainRow<{ uuid: string; cpfHash: string; nome: string }>;
export type ProtocolSectorRow = PlainRow<{ id: number }>;

type ModelGateway<Row> = {
  findAll(options?: unknown): Promise<Row[]>;
  findOne(options?: unknown): Promise<Row | null>;
  findByPk(id: string | number, options?: unknown): Promise<Row | null>;
  create(values: Record<string, unknown>, options?: unknown): Promise<Row>;
  count(options?: unknown): Promise<number>;
  min(field: string, options?: unknown): Promise<unknown>;
  max(field: string, options?: unknown): Promise<unknown>;
  update(values: Record<string, unknown>, options: unknown): Promise<[number, ...unknown[]]>;
  findOrCreate(options: unknown): Promise<[Row, boolean]>;
};

export type ProtocolModelRegistry = {
  ProtocolServiceModel: ModelGateway<ProtocolServiceRow>;
  ProtocolFormModel: ModelGateway<ProtocolFormRow>;
  ProtocolModel: ModelGateway<ProtocolPersistenceRow>;
  ProtocolMovementModel: ModelGateway<ProtocolMovementRow>;
  ProtocolAccessCodeModel: ModelGateway<ProtocolAccessCodeRow>;
  ProtocolCounterModel: ModelGateway<ProtocolCounterRow> & {
    sequelize: { query(sql: string, options: { replacements: { year: number }; transaction: Transaction }): Promise<unknown> };
    getTableName(): string | { tableName: string };
  };
  ProtocolPrivacyRequestModel: ModelGateway<ProtocolPrivacyRequestRow>;
  ProtocolNotificationModel: ModelGateway<PlainRow<{ id: number }>>;
  ProtocolAttachmentModel: ModelGateway<ProtocolAttachmentRow>;
  ProtocolRequirementModel: ModelGateway<ProtocolRequirementRow>;
  ProtocolRolePermissionModel: ModelGateway<ProtocolPermissionRow>;
  RolesModel: ModelGateway<ProtocolRoleRow>;
  MunicipeModel: ModelGateway<ProtocolMunicipeRow>;
  SetorModel: ModelGateway<ProtocolSectorRow>;
};

export function protocolModels(): ProtocolModelRegistry {
  return db.sequelize.models as unknown as ProtocolModelRegistry;
}
