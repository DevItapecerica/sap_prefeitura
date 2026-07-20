import {
  UnsubscribeUserEvent,
  UserEventHandler,
} from "./user-event-handler.js";
import { UserCreatedEvent } from "./user-created.event.js";
import { UserDeletedEvent } from "./user-deleted.event.js";
import { UserPasswordChangedEvent } from "./user-password-changed.event.js";
import { UserUpdatedEvent } from "./user-updated.event.js";

export interface UserEventSubscriber {
  onCreated(handler: UserEventHandler<UserCreatedEvent>): UnsubscribeUserEvent;
  onUpdated(handler: UserEventHandler<UserUpdatedEvent>): UnsubscribeUserEvent;
  onDeleted(handler: UserEventHandler<UserDeletedEvent>): UnsubscribeUserEvent;
  onPasswordChanged(
    handler: UserEventHandler<UserPasswordChangedEvent>,
  ): UnsubscribeUserEvent;
}
