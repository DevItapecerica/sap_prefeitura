import {
  SetorCreatedEvent,
  SetorDeletedEvent,
  SetorUpdatedEvent,
} from "./setor.events.js";

export type SetorEventHandler<T> = (event: T) => Promise<void> | void;
export type UnsubscribeSetorEvent = () => void;

export interface SetorEventPublisher {
  publishCreated(event: SetorCreatedEvent): Promise<void>;
  publishUpdated(event: SetorUpdatedEvent): Promise<void>;
  publishDeleted(event: SetorDeletedEvent): Promise<void>;
}

export interface SetorEventSubscriber {
  onCreated(handler: SetorEventHandler<SetorCreatedEvent>): UnsubscribeSetorEvent;
  onUpdated(handler: SetorEventHandler<SetorUpdatedEvent>): UnsubscribeSetorEvent;
  onDeleted(handler: SetorEventHandler<SetorDeletedEvent>): UnsubscribeSetorEvent;
}
