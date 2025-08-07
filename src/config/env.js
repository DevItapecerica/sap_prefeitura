import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Emula __dirname em ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega o arquivo .env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function must(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Env ${name} is missing`);
  return val;
}

// Exporta as variáveis
export const DATABASE_USER = must("DATABASE_USER");
export const DATABASE_KEY = must("DATABASE_KEY");
export const DATABASE_NAME = must("DATABASE_NAME");
export const DATABASE_HOST = must("DATABASE_HOST");

export const USER_API_HOST = must("USER_API_HOST");
export const USER_API_KEY = must("USER_API_KEY");

export const API_KEY = must("API_KEY");
export const SECRET_KEY = must("SECRET_KEY");

export const PORT = must("APPLICATION_PORT");
