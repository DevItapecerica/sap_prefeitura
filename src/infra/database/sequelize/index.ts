import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

import { Sequelize, DataTypes } from "sequelize";
import { DATABASE_URL } from "../../../core/env.js";
import { DbObject } from "../../../core/types/DbTypes.js";
import { isSequelizeModelFile } from "./model-loader.js";

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);
const basename: string = path.basename(__filename);

const db: DbObject = {} as DbObject;

let sequelize: Sequelize;

const envVar = DATABASE_URL;

sequelize = new Sequelize(envVar, {
  dialect: "mariadb",
});

// Carrega todos os models da pasta /model
const modelDir = path.join(__dirname, "./models");
const modelFiles = fs
  .readdirSync(modelDir)
  .filter(isSequelizeModelFile);

for (const file of modelFiles) {
  if (file === basename) {
    continue;
  }
  const filePath = path.join(modelDir, file);
  const fileUrl = pathToFileURL(filePath).href;
  const { default: defineModel } = await import(fileUrl);
  if (typeof defineModel !== "function") continue;
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
