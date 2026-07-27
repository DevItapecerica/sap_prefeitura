export const AUDITABLE_ACTIONS = [
  "VIEW",
  "LIST",
  "CREATE",
  "UPDATE",
  "DELETE",
  "EXPORT",
  "LOGIN",
  "LOGOUT",
  "LOGIN_FAILED",
  "ACCESS_DENIED",
  "PASSWORD_CHANGED",
] as const;

export type AuditableAction = (typeof AUDITABLE_ACTIONS)[number];
