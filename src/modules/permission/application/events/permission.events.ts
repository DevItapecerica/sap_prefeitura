import { ApplicationEventContext } from "../../../../core/event/application-event.js";
import { Permissions } from "../../domain/entity/Permission.js";

export const PERMISSION_EVENTS = {
  updated: "PERMISSION_UPDATED",
} as const;

export interface PermissionUpdatedEvent {
  context: ApplicationEventContext;
  before: Permissions | RolePermissionAuditSnapshot;
  after: Permissions | RolePermissionAuditSnapshot;
}

export interface PermissionEventMap {
  [PERMISSION_EVENTS.updated]: PermissionUpdatedEvent;
}

export interface RolePermissionAuditSnapshot {id: number; role_id: number; permissions: {permission_action_id: number; allowed: boolean}[]}
