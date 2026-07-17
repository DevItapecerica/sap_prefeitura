import { ApplicationEventContext } from "../../../../core/event/application-event.js";
import { eventBus } from "../../../../core/event/index.js";
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

type EventHandler<T> = (event: T) => Promise<void> | void;

const subscribe = <T>(eventName: string, handler: EventHandler<T>) => {
  eventBus.on(eventName, handler);
  return () => eventBus.off(eventName, handler);
};

export interface UserEventPublisher {
  publishCreated(event: UserCreatedEvent): Promise<void>;
  publishUpdated(event: UserUpdatedEvent): Promise<void>;
  publishDeleted(event: UserDeletedEvent): Promise<void>;
  publishPasswordChanged(event: UserPasswordChangedEvent): Promise<void>;
}

export const userEventPublisher: UserEventPublisher = {
  publishCreated: (event) => eventBus.emit(USER_EVENTS.created, event),
  publishUpdated: (event) => eventBus.emit(USER_EVENTS.updated, event),
  publishDeleted: (event) => eventBus.emit(USER_EVENTS.deleted, event),
  publishPasswordChanged: (event) =>
    eventBus.emit(USER_EVENTS.passwordChanged, event),
};

export const userEventSubscriptions = {
  onCreated: (handler: EventHandler<UserCreatedEvent>) =>
    subscribe(USER_EVENTS.created, handler),
  onUpdated: (handler: EventHandler<UserUpdatedEvent>) =>
    subscribe(USER_EVENTS.updated, handler),
  onDeleted: (handler: EventHandler<UserDeletedEvent>) =>
    subscribe(USER_EVENTS.deleted, handler),
  onPasswordChanged: (handler: EventHandler<UserPasswordChangedEvent>) =>
    subscribe(USER_EVENTS.passwordChanged, handler),
};
