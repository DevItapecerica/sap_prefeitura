import AppError from "../../../core/appError.js";

export const PROTOCOL_CAPABILITIES = ["manageCatalog", "triage", "route", "decide", "viewSector", "export", "managePrivacy", "viewRestricted", "viewOperations"] as const;
export type ProtocolCapability = (typeof PROTOCOL_CAPABILITIES)[number];
export type ProtocolCapabilities = Record<ProtocolCapability, boolean>;
export const NO_PROTOCOL_CAPABILITIES: ProtocolCapabilities = { manageCatalog: false, triage: false, route: false, decide: false, viewSector: false, export: false, managePrivacy: false, viewRestricted: false, viewOperations: false };
export const ALL_PROTOCOL_CAPABILITIES: ProtocolCapabilities = { manageCatalog: true, triage: true, route: true, decide: true, viewSector: true, export: true, managePrivacy: true, viewRestricted: true, viewOperations: true };

export function normalizeProtocolCapabilities(roleId: number, permissions?: Partial<ProtocolCapabilities> | null): ProtocolCapabilities {
  if (roleId === 1) return { ...ALL_PROTOCOL_CAPABILITIES };
  return { ...NO_PROTOCOL_CAPABILITIES, ...permissions };
}

export function assertProtocolCapability(roleId: number, permissions: Partial<ProtocolCapabilities> | null, capability: ProtocolCapability): void {
  if (roleId === 1) return;
  if (!permissions?.[capability]) {
    throw new AppError("Permissao especifica de protocolo negada", 403, "PROTOCOL_CAPABILITY_DENIED");
  }
}

export function assertProtocolCapabilitiesMutable(roleId: number, capabilities: ProtocolCapabilities): void {
  if (roleId === 1 && Object.values(capabilities).some((allowed) => !allowed)) {
    throw new AppError("Capacidades do administrador nao podem ser removidas", 400, "PROTOCOL_ADMIN_CAPABILITIES_IMMUTABLE");
  }
}
