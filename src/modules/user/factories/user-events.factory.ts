import { EventBusUserEventsAdapter } from "../../../infra/event/event-bus-user-events.adapter.js";
import {
  UserEventPublisher,
  UserEventSubscriber,
} from "../application/events/user.events.js";

export const makeUserEventPublisher = (): UserEventPublisher =>
  new EventBusUserEventsAdapter();

export const makeUserEventSubscriber = (): UserEventSubscriber =>
  new EventBusUserEventsAdapter();
