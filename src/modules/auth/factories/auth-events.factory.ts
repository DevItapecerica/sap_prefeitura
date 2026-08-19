import { EventPublisher, EventSubscriber } from "../../../core/event/event-contracts.js";
import { EventBusAdapter } from "../../../infra/event/event-bus.adapter.js";
import { AuthEventMap } from "../application/events/auth.events.js";

export const makeAuthEventPublisher = (): EventPublisher<AuthEventMap> =>
  new EventBusAdapter<AuthEventMap>();

export const makeAuthEventSubscriber = (): EventSubscriber<AuthEventMap> =>
  new EventBusAdapter<AuthEventMap>();
