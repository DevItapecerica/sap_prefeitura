import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import Sequelize from 'sequelize';
import { NODE_ENV } from '../../config/env.js';

const env = NODE_ENV || 'development';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);

const configPath = path.join(__dirname, '../config/config.json');
const configFile = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const config = configFile[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Carrega todos os models da pasta /model
const modelDir = path.join(__dirname, '');
const modelFiles = fs
  .readdirSync(modelDir)
  .filter(file => file.endsWith('.js') && !file.endsWith('.test.js'));

for (const file of modelFiles) {
  if (file === basename) {
    continue;
  }
  const filePath = path.join(modelDir, file);
  const fileUrl = pathToFileURL(filePath).href;
  const { default: defineModel } = await import(fileUrl);
  const model = defineModel(sequelize, Sequelize.DataTypes);
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