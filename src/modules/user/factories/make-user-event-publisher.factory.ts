import { EventBusUserEventsAdapter } from "../../../infra/event/event-bus-user-events.adapter.js";
import { UserEventPublisher } from "../application/events/user-event-publisher.js";

export const makeUserEventPublisher = (): UserEventPublisher =>
  new EventBusUserEventsAdapter();
