import { EventBusSetorEventsAdapter } from "../../../infra/event/event-bus-setor-events.adapter.js";
import { SetorEventPublisher } from "../application/events/setor-event-publisher.js";

export const makeSetorEventPublisher = (): SetorEventPublisher =>
  new EventBusSetorEventsAdapter();
