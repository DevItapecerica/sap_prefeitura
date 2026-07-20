import { ApplicationEventContext } from "../../../../core/event/application-event.js";
import { User } from "../../domain/entity/User.js";

export const USER_EVENTS = {
  created: "USER_CREATED",
  updated: "USER_UPDATED",
  deleted: "USER_DELETED",
  passwordChanged: "USER_PASSWORD_CHANGED",
} as const;

export interface UserCreatedEvent {
  context: ApplicationEventContext;
  user: User;
}

export interface UserUpdatedEvent {
  context: ApplicationEventContext;
  before: User;
  after: User;
}

export interface UserDeletedEvent {
  context: ApplicationEventContext;
  before: User;
}

export interface UserPasswordChangedEvent {
  context: ApplicationEventContext;
  userId: number | string;
}
