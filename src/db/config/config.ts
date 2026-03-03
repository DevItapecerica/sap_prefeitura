export default {
  development: {
    use_env_variable: "DEV_DATABASE_URL",
    dialect: "mariadb",
  },
  test: {
    username: "root",
    password: "kadoia",
    database: "database_test",
    host: "127.0.0.1",
    dialect: "mariadb",
  },
  production: {
    use_env_variable: "DATABASE_URL",
    dialect: "mariadb",
    dialectOptions: {
      connectTimeout: 10000
    }
  },
};