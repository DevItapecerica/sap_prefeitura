export type ServiceEventHandler<T> = (event: T) => Promise<void> | void;
export type UnsubscribeServiceEvent = () => void;
