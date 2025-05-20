const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
  DATABASE_USER: process.env.DATABASE_USER,
  DATABASE_KEY: process.env.DATABASE_KEY,
  DATABASE_NAME: process.env.DATABASE_NAME,
  DATABASE_HOST: process.env.DATABASE_HOST,
  
  USER_API_HOST: process.env.USER_API_HOST,
  USER_API_KEY: process.env.USER_API_KEY,

  API_KEY: process.env.API_KEY,
  SECRET_KEY: process.env.SECRET_KEY,

  PORT: process.env.APPLICATION_PORT,
};
