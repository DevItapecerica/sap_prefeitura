import {
  UserCreatedEvent,
  UserDeletedEvent,
  UserPasswordChangedEvent,
  UserUpdatedEvent,
} from "./user.events.js";

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
