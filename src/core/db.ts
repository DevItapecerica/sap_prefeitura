import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

import { Sequelize, Options, DataTypes } from "sequelize";
import { NODE_ENV } from "./env.js";

import { DbConfig, DbObject } from "../types/DbTypes.js";

import configFile from "../db/config/config.js";

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);
const basename: string = path.basename(__filename);


const env = (NODE_ENV || "development") as keyof typeof configFile;
const config: DbConfig = configFile[env] as DbConfig;
const db: DbObject = {} as DbObject;

let sequelize: Sequelize;

if (config.use_env_variable) {
  const envVar = process.env[config.use_env_variable];
  if (!envVar) {
    throw new Error(`Environment variable ${config.use_env_variable} not set.`);
  }
  sequelize = new Sequelize(envVar, config as Options);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config as Options
  );
}

// Carrega todos os models da pasta /model
const modelDir = path.join(__dirname, "../db/models");
const modelFiles = fs
  .readdirSync(modelDir)
  .filter((file) => (file.endsWith(".js") || file.endsWith(".ts")) && (!file.endsWith(".test.js") || !file.endsWith(".test.ts")));

for (const file of modelFiles) {
  if (file === basename) {
    continue;
  }
  const filePath = path.join(modelDir, file);
  const fileUrl = pathToFileURL(filePath).href;
  const { default: defineModel } = await import(fileUrl);
  if (typeof defineModel !== 'function') continue;
  const model = defineModel(sequelize, DataTypes);
  db[model.name] = model;
}

// Executa associações
for (const modelName of Object.keys(db)) {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
}

db.sequelize = sequelize;

export default db;