/** A transaction supplies scoped ports, never a driver transaction or ORM model. */
export interface UnitOfWork<Read, Write extends Read> {
  readonly read: Read;
  run<T>(work: (ports: Write) => Promise<T>): Promise<T>;
}

export interface Page<T> {
  rows: T[];
  count: number;
}
export interface Actor {
  id: string | number;
  requestId: string;
}
export type Instant = Date | string;
