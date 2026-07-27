import { eventBus } from "../../core/event/index.js";
import {
  EventHandler,
  EventMap,
  EventName,
  EventPublisher,
  EventSubscriber,
  Unsubscribe,
} from "../../core/event/event-contracts.js";

export class EventBusAdapter<TEvents extends EventMap>
  implements EventPublisher<TEvents>, EventSubscriber<TEvents>
{
  publish<TName extends EventName<TEvents>>(
    eventName: TName,
    event: TEvents[TName],
  ): Promise<void> {
    return eventBus.emit(eventName, event);
  }

  subscribe<TName extends EventName<TEvents>>(
    eventName: TName,
    handler: EventHandler<TEvents[TName]>,
  ): Unsubscribe {
    eventBus.on(eventName, handler);
    return () => eventBus.off(eventName, handler);
  }
}
