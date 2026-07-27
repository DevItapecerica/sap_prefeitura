import { EventPublisher, EventSubscriber } from "../../../core/event/event-contracts.js";
import { EventBusAdapter } from "../../../infra/event/event-bus.adapter.js";
import { EsporteEventMap } from "../application/events/esporte.events.js";

export const makeEsporteEventPublisher = (): EventPublisher<EsporteEventMap> =>
  new EventBusAdapter<EsporteEventMap>();
export const makeEsporteEventSubscriber = (): EventSubscriber<EsporteEventMap> =>
  new EventBusAdapter<EsporteEventMap>();
