const transientNumbers = new Set([1020, 1205, 1213]);
const transientCodes = new Set(["ER_CHECKREAD", "ER_LOCK_WAIT_TIMEOUT", "ER_LOCK_DEADLOCK"]);

type DatabaseErrorShape = { errno?: unknown; code?: unknown; sqlState?: unknown; parent?: unknown; original?: unknown };
const errorShape = (value: unknown): DatabaseErrorShape => typeof value === "object" && value !== null ? value as DatabaseErrorShape : {};

export function isProtocolTransactionConflict(error: unknown): boolean {
  const root = errorShape(error);
  const candidates = [root, errorShape(root.parent), errorShape(root.original)];
  return candidates.some((candidate) => transientNumbers.has(Number(candidate.errno)) || transientCodes.has(String(candidate.code)) || candidate.sqlState === "40001");
}

export async function withProtocolTransactionRetry<T>(operation: () => Promise<T>, maxAttempts = 3): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try { return await operation(); }
    catch (error) {
      if (attempt >= maxAttempts || !isProtocolTransactionConflict(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 10 * (2 ** (attempt - 1))));
    }
  }
}
