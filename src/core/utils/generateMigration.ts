import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get migration name from command-line arguments
const migrationName = process.argv[2];

if (!migrationName) {
  console.error('❌ Please provide a migration name.');
  process.exit(1);
}

// Define paths
const migrationsDir = path.resolve(__dirname, '../../infra/database/sequelize/migrations');
const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14); // YYYYMMDDHHMMSS
const fileName = `${timestamp}-${migrationName}.ts`;
const filePath = path.join(migrationsDir, fileName);

// Migration template
const migrationTemplate = `import { QueryInterface, DataTypes } from "sequelize";

/** @type {import("sequelize-cli").Migration} */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {

    //your code here 

    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {

      //your code here

    });
  },
};

`;

// Ensure migrations directory exists
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

// Write migration file
fs.writeFileSync(filePath, migrationTemplate);

console.log(`✅ Migration created: ${filePath}`);