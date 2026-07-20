import { ServiceCreatedEvent } from "./service-created.event.js";
import { ServiceDeletedEvent } from "./service-deleted.event.js";
import { ServiceUpdatedEvent } from "./service-updated.event.js";

export interface ServiceEventPublisher {
  publishCreated(event: ServiceCreatedEvent): Promise<void>;
  publishUpdated(event: ServiceUpdatedEvent): Promise<void>;
  publishDeleted(event: ServiceDeletedEvent): Promise<void>;
}
