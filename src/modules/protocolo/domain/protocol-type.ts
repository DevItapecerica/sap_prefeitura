import AppError from "../../../core/appError.js";

export const PROTOCOL_TYPES = ["REQUERIMENTO", "DENUNCIA", "RECURSO", "SOLICITACAO_SERVICO"] as const;
export type ProtocolType = (typeof PROTOCOL_TYPES)[number];
export const PROTOCOL_TYPE_POLICY_VERSION = "2026-08-12.1";

export const PROTOCOL_TYPE_POLICIES = Object.freeze({
  REQUERIMENTO: { requiresIdentification: true, anonymousOpening: false, confidentiality: "NORMAL", relation: "FORBIDDEN" },
  DENUNCIA: { requiresIdentification: true, anonymousOpening: false, confidentiality: "RESTRICTED", relation: "FORBIDDEN" },
  RECURSO: { requiresIdentification: true, anonymousOpening: false, confidentiality: "NORMAL", relation: "REQUIRED" },
  SOLICITACAO_SERVICO: { requiresIdentification: true, anonymousOpening: false, confidentiality: "NORMAL", relation: "FORBIDDEN" },
} as const);

type RelatedProtocol = { id: string; citizenId: string; state: string };

export function protocolTypePolicy(type: ProtocolType) {
  const policy = PROTOCOL_TYPE_POLICIES[type];
  if (!policy) throw new AppError("Tipo de protocolo invalido", 400, "INVALID_PROTOCOL_TYPE");
  return policy;
}

export function assertProtocolTypeOpening(type: ProtocolType, citizenId: string, relatedProtocolId?: string | null, related?: RelatedProtocol | null): void {
  const policy = protocolTypePolicy(type);
  if (policy.relation === "REQUIRED" && !relatedProtocolId) throw new AppError("Recurso exige protocolo relacionado", 422, "RELATED_PROTOCOL_REQUIRED");
  if (policy.relation === "FORBIDDEN" && relatedProtocolId) throw new AppError("Este tipo nao aceita protocolo relacionado", 422, "RELATED_PROTOCOL_FORBIDDEN");
  if (!relatedProtocolId) return;
  if (!related || related.id !== relatedProtocolId) throw new AppError("Protocolo relacionado nao encontrado", 404, "RELATED_PROTOCOL_NOT_FOUND");
  if (related.citizenId !== citizenId) throw new AppError("Protocolo relacionado nao encontrado", 404, "RELATED_PROTOCOL_NOT_FOUND");
  if (!["CONCLUIDO", "INDEFERIDO"].includes(related.state)) throw new AppError("Somente protocolo concluido ou indeferido pode receber recurso", 422, "RELATED_PROTOCOL_NOT_TERMINAL");
}
