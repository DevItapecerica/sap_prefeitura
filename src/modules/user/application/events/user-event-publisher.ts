import { UserCreatedEvent } from "./user-created.event.js";
import { UserDeletedEvent } from "./user-deleted.event.js";
import { UserPasswordChangedEvent } from "./user-password-changed.event.js";
import { UserUpdatedEvent } from "./user-updated.event.js";

export interface UserEventPublisher {
  publishCreated(event: UserCreatedEvent): Promise<void>;
  publishUpdated(event: UserUpdatedEvent): Promise<void>;
  publishDeleted(event: UserDeletedEvent): Promise<void>;
  publishPasswordChanged(event: UserPasswordChangedEvent): Promise<void>;
}
