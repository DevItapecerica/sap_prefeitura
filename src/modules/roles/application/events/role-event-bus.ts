import {
  RoleCreatedEvent,
  RoleDeletedEvent,
  RoleUpdatedEvent,
} from "./role.events.js";

export type RoleEventHandler<T> = (event: T) => Promise<void> | void;
export type UnsubscribeRoleEvent = () => void;

export interface RoleEventPublisher {
  publishCreated(event: RoleCreatedEvent): Promise<void>;
  publishUpdated(event: RoleUpdatedEvent): Promise<void>;
  publishDeleted(event: RoleDeletedEvent): Promise<void>;
}

export interface RoleEventSubscriber {
  onCreated(handler: RoleEventHandler<RoleCreatedEvent>): UnsubscribeRoleEvent;
  onUpdated(handler: RoleEventHandler<RoleUpdatedEvent>): UnsubscribeRoleEvent;
  onDeleted(handler: RoleEventHandler<RoleDeletedEvent>): UnsubscribeRoleEvent;
}
