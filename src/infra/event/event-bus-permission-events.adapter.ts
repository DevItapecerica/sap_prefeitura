import { eventBus } from "../../core/event/index.js";
import {
  PermissionEventHandler,
  PermissionEventPublisher,
  PermissionEventSubscriber,
} from "../../modules/permission/application/events/permission-event-bus.js";
import {
  PERMISSION_EVENTS,
  PermissionUpdatedEvent,
} from "../../modules/permission/application/events/permission.events.js";

export class EventBusPermissionEventsAdapter
  implements PermissionEventPublisher, PermissionEventSubscriber
{
  publishUpdated(event: PermissionUpdatedEvent): Promise<void> {
    return eventBus.emit(PERMISSION_EVENTS.updated, event);
  }

  onUpdated(handler: PermissionEventHandler<PermissionUpdatedEvent>) {
    eventBus.on(PERMISSION_EVENTS.updated, handler);
    return () => eventBus.off(PERMISSION_EVENTS.updated, handler);
  }
}
