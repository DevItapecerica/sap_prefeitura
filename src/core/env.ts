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

export const NODE_ENV = must("NODE_ENV");
export const DATABASE_URL = must("DATABASE_URL");

export const SECRET_KEY = must("SECRET_KEY");

export const FT_APP_API_HOST = must("FT_APP_API_HOST");
export const FT_APP_API_KEY = must("FT_APP_API_KEY");

export const MAIL_ADRESS = must("MAIL_ADRESS");
export const MAIL_PASSWORD = must("MAIL_PASSWORD");
export const MAIL_HOST = must("MAIL_HOST");

export const CORS_ORIGINS = must("CORS_ORIGINS");

export const PORT = must("APPLICATION_PORT");
