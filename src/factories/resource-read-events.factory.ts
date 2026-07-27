import { EventPublisher, EventSubscriber } from "../core/event/event-contracts.js";
import { ResourceReadEventMap } from "../core/event/resource-read.events.js";
import { EventBusAdapter } from "../infra/event/event-bus.adapter.js";

export const makeResourceReadEventPublisher =
  (): EventPublisher<ResourceReadEventMap> =>
    new EventBusAdapter<ResourceReadEventMap>();

export const makeResourceReadEventSubscriber =
  (): EventSubscriber<ResourceReadEventMap> =>
    new EventBusAdapter<ResourceReadEventMap>();
