import SequelizeLib from "sequelize";
import { DATABASE_URL } from "../config/env.js";

const Sequelize = new SequelizeLib(DATABASE_URL, {
  dialect: "mariadb",
  connectTimeout: 10000,
});

Sequelize.authenticate()
  .then(() => {
    console.log("✅ Conectado ao banco de dados");
  })
  .catch((err) => {
    console.error(`Sem sucesso na conexão com o banco de dados: ${err}`);
  });

export default Sequelize;
