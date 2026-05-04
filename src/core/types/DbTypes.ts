import { Model, ModelStatic, Sequelize } from "sequelize";

interface use_env_variable {
  use_env_variable: string;
  [key: string]: any;
}

interface database {
  database: string;
  username: string;
  password: string;
  [key: string]: any;
}

export type DbConfig = use_env_variable | database;

export interface DbObject {
  [key: string]: ModelStatic<Model> | any; // Para modelos tipados
  sequelize: Sequelize;
}