import { EventPublisher, EventSubscriber } from "../../../core/event/event-contracts.js";
import { EventBusAdapter } from "../../../infra/event/event-bus.adapter.js";
import { MunicipeEventMap } from "../application/events/municipe.events.js";

export const makeMunicipeEventPublisher = (): EventPublisher<MunicipeEventMap> =>
  new EventBusAdapter<MunicipeEventMap>();

export const makeMunicipeEventSubscriber = (): EventSubscriber<MunicipeEventMap> =>
  new EventBusAdapter<MunicipeEventMap>();
