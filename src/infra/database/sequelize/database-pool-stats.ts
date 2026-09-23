import type { DatabasePoolStats } from "../../../core/observability/metrics.js";
import db from "./index.js";

type PoolWithPublicStats = {
  size: number;
  available: number;
  using: number;
  waiting: number;
};

export const readDatabasePoolStats = (
  connectionManager: unknown,
): DatabasePoolStats | undefined => {
  const pool = (connectionManager as { pool?: Partial<PoolWithPublicStats> })
    ?.pool;
  const total = pool?.size;
  const available = pool?.available;
  const inUse = pool?.using;
  const pending = pool?.waiting;

  if (
    typeof total !== "number" ||
    typeof available !== "number" ||
    typeof inUse !== "number" ||
    typeof pending !== "number"
  ) {
    return undefined;
  }

  return {
    total,
    available,
    in_use: inUse,
    pending,
  };
};

export const getDatabasePoolStats = (): DatabasePoolStats | undefined =>
  readDatabasePoolStats(
    (db.sequelize as unknown as { connectionManager?: unknown })
      .connectionManager,
  );
