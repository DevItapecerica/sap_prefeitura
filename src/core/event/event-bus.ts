export type EventMap = Record<string, any>;
type EventHandler<T> = (payload: T) => Promise<void> | void;

export class EventBus<Events extends EventMap = EventMap> {
  private handlers: Partial<Record<keyof Events, EventHandler<any>[]>> = {};

  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>) {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }

    this.handlers[event].push(handler);
  }

  off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>) {
    const handlers = this.handlers[event] || [];
    this.handlers[event] = handlers.filter((h) => h !== handler);
  }

  async emit<K extends keyof Events>(event: K, payload: Events[K]) {
    const handlers = this.handlers[event] || [];

    await Promise.all(handlers.map((h) => h(payload)));
  }
}
