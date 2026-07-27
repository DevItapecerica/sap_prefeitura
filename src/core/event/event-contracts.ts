// Deliberately avoids a string index signature so keyof keeps only the
// event names explicitly declared by each module.
export type EventMap = object;

export type EventName<TEvents extends EventMap> = Extract<
  keyof TEvents,
  string
>;

export type EventHandler<TEvent> = (
  event: TEvent,
) => Promise<void> | void;

export type Unsubscribe = () => void;

export interface EventPublisher<TEvents extends EventMap> {
  publish<TName extends EventName<TEvents>>(
    eventName: TName,
    event: TEvents[TName],
  ): Promise<void>;
}

export interface EventSubscriber<TEvents extends EventMap> {
  subscribe<TName extends EventName<TEvents>>(
    eventName: TName,
    handler: EventHandler<TEvents[TName]>,
  ): Unsubscribe;
}
