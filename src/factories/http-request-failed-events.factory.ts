import { EventPublisher, EventSubscriber } from "../core/event/event-contracts.js";
import { HttpRequestFailedEventMap } from "../core/event/http-request-failed.events.js";
import { EventBusAdapter } from "../infra/event/event-bus.adapter.js";

export const makeHttpRequestFailedEventPublisher =
  (): EventPublisher<HttpRequestFailedEventMap> =>
    new EventBusAdapter<HttpRequestFailedEventMap>();

export const makeHttpRequestFailedEventSubscriber =
  (): EventSubscriber<HttpRequestFailedEventMap> =>
    new EventBusAdapter<HttpRequestFailedEventMap>();
