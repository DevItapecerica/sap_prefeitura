import { ApplicationEventContext } from "../../../../core/event/application-event.js";
import { Permissions } from "../../domain/entity/Permission.js";

export const PERMISSION_EVENTS = {
  updated: "PERMISSION_UPDATED",
} as const;

export interface PermissionUpdatedEvent {
  context: ApplicationEventContext;
  before: Permissions;
  after: Permissions;
}
