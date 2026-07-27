import { EventPublisher, EventSubscriber } from "../../../core/event/event-contracts.js";
import { EventBusAdapter } from "../../../infra/event/event-bus.adapter.js";
import { FtBolsistaEventMap } from "../application/events/ft-bolsista.events.js";

export const makeFtBolsistaEventPublisher = (): EventPublisher<FtBolsistaEventMap> =>
  new EventBusAdapter<FtBolsistaEventMap>();
export const makeFtBolsistaEventSubscriber = (): EventSubscriber<FtBolsistaEventMap> =>
  new EventBusAdapter<FtBolsistaEventMap>();
