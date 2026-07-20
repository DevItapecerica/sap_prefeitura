import {
  ServiceCreatedEvent,
  ServiceDeletedEvent,
  ServiceUpdatedEvent,
} from "./service.events.js";

export type ServiceEventHandler<T> = (event: T) => Promise<void> | void;
export type UnsubscribeServiceEvent = () => void;

export interface ServiceEventPublisher {
  publishCreated(event: ServiceCreatedEvent): Promise<void>;
  publishUpdated(event: ServiceUpdatedEvent): Promise<void>;
  publishDeleted(event: ServiceDeletedEvent): Promise<void>;
}

export interface ServiceEventSubscriber {
  onCreated(handler: ServiceEventHandler<ServiceCreatedEvent>): UnsubscribeServiceEvent;
  onUpdated(handler: ServiceEventHandler<ServiceUpdatedEvent>): UnsubscribeServiceEvent;
  onDeleted(handler: ServiceEventHandler<ServiceDeletedEvent>): UnsubscribeServiceEvent;
}
