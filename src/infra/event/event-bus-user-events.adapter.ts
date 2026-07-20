import { eventBus } from "../../core/event/index.js";
import {
  USER_EVENTS,
  UserCreatedEvent,
  UserDeletedEvent,
  UserEventHandler,
  UserEventPublisher,
  UserEventSubscriber,
  UserPasswordChangedEvent,
  UserUpdatedEvent,
} from "../../modules/user/application/events/user.events.js";

export class EventBusUserEventsAdapter
  implements UserEventPublisher, UserEventSubscriber
{
  publishCreated(event: UserCreatedEvent): Promise<void> {
    return eventBus.emit(USER_EVENTS.created, event);
  }

  publishUpdated(event: UserUpdatedEvent): Promise<void> {
    return eventBus.emit(USER_EVENTS.updated, event);
  }

  publishDeleted(event: UserDeletedEvent): Promise<void> {
    return eventBus.emit(USER_EVENTS.deleted, event);
  }

  publishPasswordChanged(event: UserPasswordChangedEvent): Promise<void> {
    return eventBus.emit(USER_EVENTS.passwordChanged, event);
  }

  onCreated(handler: UserEventHandler<UserCreatedEvent>) {
    return this.subscribe(USER_EVENTS.created, handler);
  }

  onUpdated(handler: UserEventHandler<UserUpdatedEvent>) {
    return this.subscribe(USER_EVENTS.updated, handler);
  }

  onDeleted(handler: UserEventHandler<UserDeletedEvent>) {
    return this.subscribe(USER_EVENTS.deleted, handler);
  }

  onPasswordChanged(handler: UserEventHandler<UserPasswordChangedEvent>) {
    return this.subscribe(USER_EVENTS.passwordChanged, handler);
  }

  private subscribe<T>(eventName: string, handler: UserEventHandler<T>) {
    eventBus.on(eventName, handler);
    return () => eventBus.off(eventName, handler);
  }
}
