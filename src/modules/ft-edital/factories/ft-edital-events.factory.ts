import { EventPublisher, EventSubscriber } from "../../../core/event/event-contracts.js";
import { EventBusAdapter } from "../../../infra/event/event-bus.adapter.js";
import { FtEditalEventMap } from "../application/events/ft-edital.events.js";

export const makeFtEditalEventPublisher = (): EventPublisher<FtEditalEventMap> =>
  new EventBusAdapter<FtEditalEventMap>();
export const makeFtEditalEventSubscriber = (): EventSubscriber<FtEditalEventMap> =>
  new EventBusAdapter<FtEditalEventMap>();
