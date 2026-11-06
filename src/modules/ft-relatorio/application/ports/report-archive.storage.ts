import type { Readable } from "node:stream";

export interface ReportArchiveWriter {
  append(content: Buffer | string, name: string): void;
  finish(): Promise<{ path: string; size: number }>;
  abort(): Promise<void>;
}
export interface ReportArchiveStorage {
  open(path: string): Promise<{ path: string; size: number; stream: Readable }>;
  remove(path: string): Promise<void>;
  create(id: string): Promise<ReportArchiveWriter>;
  purgeTemporary(before: Date): Promise<void>;
}
export class ReportArchiveError extends Error {
  constructor(public readonly code: "INVALID_PATH" | "UNAVAILABLE") {
    super(code);
  }
}
export type ReportBatchEvents = { FT_REPORT_BATCH_AVAILABLE: { id: string } };
