import { EventBusServiceEventsAdapter } from "../../../infra/event/event-bus-service-events.adapter.js";
import { ServiceEventPublisher } from "../application/events/service-event-publisher.js";

export const makeServiceEventPublisher = (): ServiceEventPublisher =>
  new EventBusServiceEventsAdapter();
