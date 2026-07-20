import { eventBus } from "../../core/event/index.js";
import { UserCreatedEvent } from "../../modules/user/application/events/user-created.event.js";
import { UserDeletedEvent } from "../../modules/user/application/events/user-deleted.event.js";
import { UserEventHandler } from "../../modules/user/application/events/user-event-handler.js";
import { USER_EVENTS } from "../../modules/user/application/events/user-event-names.js";
import { UserEventPublisher } from "../../modules/user/application/events/user-event-publisher.js";
import { UserEventSubscriber } from "../../modules/user/application/events/user-event-subscriber.js";
import { UserPasswordChangedEvent } from "../../modules/user/application/events/user-password-changed.event.js";
import { UserUpdatedEvent } from "../../modules/user/application/events/user-updated.event.js";

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
