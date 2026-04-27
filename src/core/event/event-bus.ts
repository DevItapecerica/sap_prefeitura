type EventHandler<T = any> = (payload: T) => Promise<void> | void;

export class EventBus {
  private handlers: Record<string, EventHandler[]> = {};

  on(event: string, handler: EventHandler) {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }

    this.handlers[event].push(handler);
  }

  async emit(event: string, payload: any) {
    const handlers = this.handlers[event] || [];

    await Promise.all(handlers.map((h) => h(payload)));
  }
}