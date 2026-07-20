import { EventBusServiceEventsAdapter } from "../../../infra/event/event-bus-service-events.adapter.js";
import { ServiceEventSubscriber } from "../application/events/service-event-subscriber.js";

export const makeServiceEventSubscriber = (): ServiceEventSubscriber =>
  new EventBusServiceEventsAdapter();
