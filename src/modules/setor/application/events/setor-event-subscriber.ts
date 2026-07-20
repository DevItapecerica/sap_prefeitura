import {
  SetorEventHandler,
  UnsubscribeSetorEvent,
} from "./setor-event-handler.js";
import { SetorCreatedEvent } from "./setor-created.event.js";
import { SetorDeletedEvent } from "./setor-deleted.event.js";
import { SetorUpdatedEvent } from "./setor-updated.event.js";

export interface SetorEventSubscriber {
  onCreated(
    handler: SetorEventHandler<SetorCreatedEvent>,
  ): UnsubscribeSetorEvent;
  onUpdated(
    handler: SetorEventHandler<SetorUpdatedEvent>,
  ): UnsubscribeSetorEvent;
  onDeleted(
    handler: SetorEventHandler<SetorDeletedEvent>,
  ): UnsubscribeSetorEvent;
}
