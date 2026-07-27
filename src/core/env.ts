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
