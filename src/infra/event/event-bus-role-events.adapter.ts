import { eventBus } from "../../core/event/index.js";
import {
  RoleEventHandler,
  RoleEventPublisher,
  RoleEventSubscriber,
} from "../../modules/roles/application/events/role-event-bus.js";
import {
  ROLE_EVENTS,
  RoleCreatedEvent,
  RoleDeletedEvent,
  RoleUpdatedEvent,
} from "../../modules/roles/application/events/role.events.js";

export class EventBusRoleEventsAdapter
  implements RoleEventPublisher, RoleEventSubscriber
{
  publishCreated(event: RoleCreatedEvent): Promise<void> {
    return eventBus.emit(ROLE_EVENTS.created, event);
  }

  publishUpdated(event: RoleUpdatedEvent): Promise<void> {
    return eventBus.emit(ROLE_EVENTS.updated, event);
  }

  publishDeleted(event: RoleDeletedEvent): Promise<void> {
    return eventBus.emit(ROLE_EVENTS.deleted, event);
  }

  onCreated(handler: RoleEventHandler<RoleCreatedEvent>) {
    return this.subscribe(ROLE_EVENTS.created, handler);
  }

  onUpdated(handler: RoleEventHandler<RoleUpdatedEvent>) {
    return this.subscribe(ROLE_EVENTS.updated, handler);
  }

  onDeleted(handler: RoleEventHandler<RoleDeletedEvent>) {
    return this.subscribe(ROLE_EVENTS.deleted, handler);
  }

  private subscribe<T>(eventName: string, handler: RoleEventHandler<T>) {
    eventBus.on(eventName, handler);
    return () => eventBus.off(eventName, handler);
  }
}
