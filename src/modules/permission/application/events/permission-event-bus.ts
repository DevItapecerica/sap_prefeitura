import { PermissionUpdatedEvent } from "./permission.events.js";

export type PermissionEventHandler<T> = (event: T) => Promise<void> | void;
export type UnsubscribePermissionEvent = () => void;

export interface PermissionEventPublisher {
  publishUpdated(event: PermissionUpdatedEvent): Promise<void>;
}

export interface PermissionEventSubscriber {
  onUpdated(
    handler: PermissionEventHandler<PermissionUpdatedEvent>,
  ): UnsubscribePermissionEvent;
}
