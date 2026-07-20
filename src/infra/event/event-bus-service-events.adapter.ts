import { eventBus } from "../../core/event/index.js";
import { ServiceCreatedEvent } from "../../modules/services/application/events/service-created.event.js";
import { ServiceDeletedEvent } from "../../modules/services/application/events/service-deleted.event.js";
import { ServiceEventHandler } from "../../modules/services/application/events/service-event-handler.js";
import { SERVICE_EVENTS } from "../../modules/services/application/events/service-event-names.js";
import { ServiceEventPublisher } from "../../modules/services/application/events/service-event-publisher.js";
import { ServiceEventSubscriber } from "../../modules/services/application/events/service-event-subscriber.js";
import { ServiceUpdatedEvent } from "../../modules/services/application/events/service-updated.event.js";

export class EventBusServiceEventsAdapter
  implements ServiceEventPublisher, ServiceEventSubscriber
{
  publishCreated(event: ServiceCreatedEvent): Promise<void> {
    return eventBus.emit(SERVICE_EVENTS.created, event);
  }

  publishUpdated(event: ServiceUpdatedEvent): Promise<void> {
    return eventBus.emit(SERVICE_EVENTS.updated, event);
  }

  publishDeleted(event: ServiceDeletedEvent): Promise<void> {
    return eventBus.emit(SERVICE_EVENTS.deleted, event);
  }

  onCreated(handler: ServiceEventHandler<ServiceCreatedEvent>) {
    return this.subscribe(SERVICE_EVENTS.created, handler);
  }

  onUpdated(handler: ServiceEventHandler<ServiceUpdatedEvent>) {
    return this.subscribe(SERVICE_EVENTS.updated, handler);
  }

  onDeleted(handler: ServiceEventHandler<ServiceDeletedEvent>) {
    return this.subscribe(SERVICE_EVENTS.deleted, handler);
  }

  private subscribe<T>(eventName: string, handler: ServiceEventHandler<T>) {
    eventBus.on(eventName, handler);
    return () => eventBus.off(eventName, handler);
  }
}
