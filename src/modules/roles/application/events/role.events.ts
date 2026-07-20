import { ApplicationEventContext } from "../../../../core/event/application-event.js";
import { Roles } from "../../domain/entity/Role.js";
import { RoleAggregate } from "../../domain/repository/roles.repository.js";

export const ROLE_EVENTS = {
  created: "ROLE_CREATED",
  updated: "ROLE_UPDATED",
  deleted: "ROLE_DELETED",
} as const;

export interface RoleCreatedEvent {
  context: ApplicationEventContext;
  role: Roles;
}

export interface RoleUpdatedEvent {
  context: ApplicationEventContext;
  before: Roles;
  after: Roles;
}

export interface RoleDeletedEvent {
  context: ApplicationEventContext;
  before: RoleAggregate;
}
