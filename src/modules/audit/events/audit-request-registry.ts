// Transitional coordination while successful mutations from legacy modules
// are still audited by the generic HTTP hook.
const HANDLED_REQUEST_TTL_MS = 60_000;
const MAX_HANDLED_REQUESTS = 10_000;
const handledRequests = new Map<string, number>();

const pruneExpired = (now: number): void => {
  for (const [requestId, expiresAt] of handledRequests) {
    if (expiresAt <= now) handledRequests.delete(requestId);
  }
};

export const markAuditRequestHandled = (
  requestId: string,
  now = Date.now(),
): void => {
  pruneExpired(now);
  if (handledRequests.size >= MAX_HANDLED_REQUESTS) {
    const oldestRequestId = handledRequests.keys().next().value;
    if (oldestRequestId) handledRequests.delete(oldestRequestId);
  }
  handledRequests.set(requestId, now + HANDLED_REQUEST_TTL_MS);
};

export const consumeAuditRequestHandled = (
  requestId: string,
  now = Date.now(),
): boolean => {
  pruneExpired(now);
  return handledRequests.delete(requestId);
};

export const auditRequestRegistryTesting = {
  ttlMs: HANDLED_REQUEST_TTL_MS,
  size: () => handledRequests.size,
  clear: () => handledRequests.clear(),
};
