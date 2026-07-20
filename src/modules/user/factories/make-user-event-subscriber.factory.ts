import { EventBusUserEventsAdapter } from "../../../infra/event/event-bus-user-events.adapter.js";
import { UserEventSubscriber } from "../application/events/user-event-subscriber.js";

export const makeUserEventSubscriber = (): UserEventSubscriber =>
  new EventBusUserEventsAdapter();
