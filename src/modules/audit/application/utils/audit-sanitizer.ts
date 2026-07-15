const FORBIDDEN_FIELDS = new Set([
  "password", "senha", "old_password", "new_password", "password_hash",
  "token", "access_token", "refresh_token", "refresh_token_hash", "authorization",
  "cookie", "cookies", "secret", "secret_key", "api_key", "private_key",
  "image", "imagem", "foto", "file", "arquivo", "document",
]);

const isForbidden = (key: string) => {
  const normalized = key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase().replace(/[-\s]/g, "_");
  return FORBIDDEN_FIELDS.has(normalized) || normalized.endsWith("_token") ||
    normalized.endsWith("_password") || normalized.endsWith("_secret") ||
    normalized.endsWith("_image") || normalized.endsWith("_file");
};

export function sanitizeAuditValue(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return value.toString();
  if (typeof value !== "object") return value;
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return "[OMITTED_BINARY]";
  if (seen.has(value)) return "[CIRCULAR]";
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => sanitizeAuditValue(item, seen));
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !isForbidden(key))
    .map(([key, item]) => [key, sanitizeAuditValue(item, seen)]));
}
