import { EventBusSetorEventsAdapter } from "../../../infra/event/event-bus-setor-events.adapter.js";
import { SetorEventSubscriber } from "../application/events/setor-event-subscriber.js";

export const makeSetorEventSubscriber = (): SetorEventSubscriber =>
  new EventBusSetorEventsAdapter();
