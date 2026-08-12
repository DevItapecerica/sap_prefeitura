import type { MunicipeDto } from "../../municipe/application/dto/municipe.dto.js";
import type { FormField, ProtocolState } from "../domain/protocolo.js";
import type { ProtocolType } from "../domain/protocol-type.js";

export type ProtocolInternalUser = {
  id: number | string;
  name?: string;
  role_id: number | string;
  setor_id?: number | string | null;
};

export type ProtocolOpeningInput = {
  serviceId: number;
  subject: string;
  answers: Record<string, unknown>;
  relatedProtocolId?: string;
};

export type InternalProtocolOpeningInput = ProtocolOpeningInput & {
  citizenId: string;
  email: string;
};

export type ProtocolListQuery = {
  state?: ProtocolState;
  sectorId?: number;
  assigneeId?: number;
  from?: string;
  to?: string;
  protocolType?: ProtocolType;
};

export type ProtocolTransitionInput = {
  actorId?: number;
  actorType?: "CITIZEN" | "USER" | "SYSTEM";
  citizenId?: string;
  toSectorId?: number | null;
  assigneeId?: number | null;
  publicMessage?: string;
  internalMessage?: string;
  requireAssignee?: boolean;
};

export type ProtocolRequirementInput = { description: string; dueAt: string };
export type ProtocolRequirementAnswerInput = { response: string };
export type ProtocolForwardInput = { toSectorId: number; publicMessage?: string; internalMessage?: string };
export type ProtocolMessageInput = { message: string };
export type ProtocolLegalHoldInput = { active: boolean; reason?: string };
export type ProtocolDecisionInput = { to: "CONCLUIDO" | "INDEFERIDO"; publicMessage?: string; internalMessage?: string };
export type ProtocolPrivacyListQuery = { status?: "RECEIVED" | "IN_REVIEW" | "FULFILLED" | "DENIED" };
export type ProtocolPrivacyUpdateInput = { status: "IN_REVIEW" | "FULFILLED" | "DENIED"; response?: string };

export type ProtocolServiceInput = {
  name: string;
  description: string;
  deadlineDays: number;
  defaultSectorId?: number | null;
  active?: boolean;
  protocolType?: ProtocolType;
};

export type ProtocolServiceDraftInput = ProtocolServiceInput & { fields: FormField[] };
export type ProtocolFormInput = { fields: FormField[] };
export type ProtocolCitizenInput = MunicipeDto;

export type ProtocolCsvRow = {
  publicNumber: string;
  protocolType?: ProtocolType;
  confidentiality?: "NORMAL" | "RESTRICTED";
  subject: string;
  state: ProtocolState;
  currentSectorId?: number | null;
  assigneeId?: number | null;
  createdAt?: Date;
  dueAt?: Date;
};
