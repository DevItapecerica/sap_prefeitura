import AppError from "../../../core/appError.js";

export type InternalProtocolOperation = "VIEW" | "ASSUME" | "FORWARD" | "MUTATE" | "PRIVACY";

type ProtocolAccessSnapshot = {
  currentSectorId?: number | null;
  assigneeId?: number | null;
  state: string;
};

type InternalUser = { id: number | string; role_id: number | string; setor_id?: number | string | null };

export function requiresRestrictedCapability(confidentiality: string, operation: InternalProtocolOperation): boolean {
  return confidentiality === "RESTRICTED" && operation !== "PRIVACY";
}

export function assertInternalProtocolAccess(
  protocol: ProtocolAccessSnapshot,
  user: InternalUser,
  operation: InternalProtocolOperation,
): void {
  if (Number(user.role_id) === 1) return;
  // A capacidade global de privacidade é validada pela rota antes desta política.
  // A preservação legal não pode depender de o encarregado pertencer ao setor atual.
  if (operation === "PRIVACY") return;
  if (!user.setor_id || Number(protocol.currentSectorId) !== Number(user.setor_id)) {
    throw new AppError("Protocolo nao pertence ao setor do usuario", 403, "PROTOCOL_SECTOR_DENIED");
  }
  if (operation === "VIEW") return;

  const assigneeId = protocol.assigneeId == null ? null : Number(protocol.assigneeId);
  const userId = Number(user.id);
  if (operation === "ASSUME") {
    if (assigneeId !== null && assigneeId !== userId) {
      throw new AppError("Protocolo ja atribuido a outro responsavel", 403, "PROTOCOL_ASSIGNEE_DENIED");
    }
    return;
  }
  if (operation === "FORWARD" && protocol.state === "EM_TRIAGEM" && assigneeId === null) return;
  if (assigneeId !== userId) {
    throw new AppError("Operacao exclusiva do responsavel pelo protocolo", 403, "PROTOCOL_ASSIGNEE_DENIED");
  }
}
