// config/env.ts
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function must(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Env ${name} is missing`);
  return val;
}

function optionalPort(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`Env ${name} must be a valid port`);
  }
  return port;
}

function optionalBoolean(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (!value) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`Env ${name} must be "true" or "false"`);
}

function optionalPositiveInteger(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`Env ${name} must be a positive integer`);
  return parsed;
}

export const NODE_ENV = must("NODE_ENV");
export const DATABASE_URL = must("DATABASE_URL");

export const SECRET_KEY = must("SECRET_KEY");

export const MAIL_ADRESS = must("MAIL_ADRESS");
export const MAIL_PASSWORD = must("MAIL_PASSWORD");
export const MAIL_HOST = must("MAIL_HOST");
export const MAIL_PORT = optionalPort("MAIL_PORT", 25);
export const MAIL_SECURE = optionalBoolean(
  "MAIL_SECURE",
  MAIL_PORT === 465,
);

export const CORS_ORIGINS = must("CORS_ORIGINS");

export const PORT = must("APPLICATION_PORT");

export const PDF_API_URL = must("PDF_API_URL");

export const PROTOCOL_PUBLIC_URL = process.env.PROTOCOL_PUBLIC_URL || "http://localhost:5173/protocolo";
export const PROTOCOL_STORAGE_DIR = process.env.PROTOCOL_STORAGE_DIR || "./private/protocolos";
export const PROTOCOL_MAX_FILE_BYTES = Number(process.env.PROTOCOL_MAX_FILE_BYTES || 10 * 1024 * 1024);
export const PROTOCOL_CODE_TTL_MINUTES = Number(process.env.PROTOCOL_CODE_TTL_MINUTES || 10);
export const PROTOCOL_TOKEN_SECRET = process.env.PROTOCOL_TOKEN_SECRET || (NODE_ENV === "production" ? must("PROTOCOL_TOKEN_SECRET") : SECRET_KEY);
export const PROTOCOL_PRIVACY_CONTACT_URL = process.env.PROTOCOL_PRIVACY_CONTACT_URL || "https://www.itapecerica.sp.gov.br/transparencia";
export const PROTOCOL_RETENTION_POLICY_REFERENCE = process.env.PROTOCOL_RETENTION_POLICY_REFERENCE?.trim() || null;
export const PROTOCOL_RETENTION_DAYS = process.env.PROTOCOL_RETENTION_DAYS ? optionalPositiveInteger("PROTOCOL_RETENTION_DAYS", 0) : null;
export const PROTOCOL_ALERT_OVERDUE_THRESHOLD = optionalPositiveInteger("PROTOCOL_ALERT_OVERDUE_THRESHOLD", 10);
export const PROTOCOL_ALERT_FAILED_NOTIFICATIONS_THRESHOLD = optionalPositiveInteger("PROTOCOL_ALERT_FAILED_NOTIFICATIONS_THRESHOLD", 1);
export const PROTOCOL_ALERT_OPEN_PRIVACY_DAYS = optionalPositiveInteger("PROTOCOL_ALERT_OPEN_PRIVACY_DAYS", 10);
export const CLAMAV_HOST = process.env.CLAMAV_HOST || "127.0.0.1";
export const CLAMAV_PORT = optionalPort("CLAMAV_PORT", 3310);
export const CLAMAV_TIMEOUT_MS = optionalPositiveInteger("CLAMAV_TIMEOUT_MS", 10_000);
