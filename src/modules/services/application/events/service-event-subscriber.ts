import { ServiceCreatedEvent } from "./service-created.event.js";
import { ServiceDeletedEvent } from "./service-deleted.event.js";
import {
  ServiceEventHandler,
  UnsubscribeServiceEvent,
} from "./service-event-handler.js";
import { ServiceUpdatedEvent } from "./service-updated.event.js";

export interface ServiceEventSubscriber {
  onCreated(
    handler: ServiceEventHandler<ServiceCreatedEvent>,
  ): UnsubscribeServiceEvent;
  onUpdated(
    handler: ServiceEventHandler<ServiceUpdatedEvent>,
  ): UnsubscribeServiceEvent;
  onDeleted(
    handler: ServiceEventHandler<ServiceDeletedEvent>,
  ): UnsubscribeServiceEvent;
}
