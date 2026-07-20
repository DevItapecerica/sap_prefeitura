import { SetorCreatedEvent } from "./setor-created.event.js";
import { SetorDeletedEvent } from "./setor-deleted.event.js";
import { SetorUpdatedEvent } from "./setor-updated.event.js";

export interface SetorEventPublisher {
  publishCreated(event: SetorCreatedEvent): Promise<void>;
  publishUpdated(event: SetorUpdatedEvent): Promise<void>;
  publishDeleted(event: SetorDeletedEvent): Promise<void>;
}
