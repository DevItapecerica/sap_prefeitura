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

export type UserEventHandler<T> = (event: T) => Promise<void> | void;
export type UnsubscribeUserEvent = () => void;

export interface UserEventPublisher {
  publishCreated(event: UserCreatedEvent): Promise<void>;
  publishUpdated(event: UserUpdatedEvent): Promise<void>;
  publishDeleted(event: UserDeletedEvent): Promise<void>;
  publishPasswordChanged(event: UserPasswordChangedEvent): Promise<void>;
}

export interface UserEventSubscriber {
  onCreated(handler: UserEventHandler<UserCreatedEvent>): UnsubscribeUserEvent;
  onUpdated(handler: UserEventHandler<UserUpdatedEvent>): UnsubscribeUserEvent;
  onDeleted(handler: UserEventHandler<UserDeletedEvent>): UnsubscribeUserEvent;
  onPasswordChanged(
    handler: UserEventHandler<UserPasswordChangedEvent>,
  ): UnsubscribeUserEvent;
}
