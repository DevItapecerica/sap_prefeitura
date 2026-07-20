export type UserEventHandler<T> = (event: T) => Promise<void> | void;
export type UnsubscribeUserEvent = () => void;
