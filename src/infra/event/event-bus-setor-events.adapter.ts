import { eventBus } from "../../core/event/index.js";
import { SetorCreatedEvent } from "../../modules/setor/application/events/setor-created.event.js";
import { SetorDeletedEvent } from "../../modules/setor/application/events/setor-deleted.event.js";
import { SetorEventHandler } from "../../modules/setor/application/events/setor-event-handler.js";
import { SETOR_EVENTS } from "../../modules/setor/application/events/setor-event-names.js";
import { SetorEventPublisher } from "../../modules/setor/application/events/setor-event-publisher.js";
import { SetorEventSubscriber } from "../../modules/setor/application/events/setor-event-subscriber.js";
import { SetorUpdatedEvent } from "../../modules/setor/application/events/setor-updated.event.js";

export class EventBusSetorEventsAdapter
  implements SetorEventPublisher, SetorEventSubscriber
{
  publishCreated(event: SetorCreatedEvent): Promise<void> {
    return eventBus.emit(SETOR_EVENTS.created, event);
  }

  publishUpdated(event: SetorUpdatedEvent): Promise<void> {
    return eventBus.emit(SETOR_EVENTS.updated, event);
  }

  publishDeleted(event: SetorDeletedEvent): Promise<void> {
    return eventBus.emit(SETOR_EVENTS.deleted, event);
  }

  onCreated(handler: SetorEventHandler<SetorCreatedEvent>) {
    return this.subscribe(SETOR_EVENTS.created, handler);
  }

  onUpdated(handler: SetorEventHandler<SetorUpdatedEvent>) {
    return this.subscribe(SETOR_EVENTS.updated, handler);
  }

  onDeleted(handler: SetorEventHandler<SetorDeletedEvent>) {
    return this.subscribe(SETOR_EVENTS.deleted, handler);
  }

  private subscribe<T>(eventName: string, handler: SetorEventHandler<T>) {
    eventBus.on(eventName, handler);
    return () => eventBus.off(eventName, handler);
  }
}
