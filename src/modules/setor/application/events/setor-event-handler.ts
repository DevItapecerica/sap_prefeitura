export type SetorEventHandler<T> = (event: T) => Promise<void> | void;
export type UnsubscribeSetorEvent = () => void;
