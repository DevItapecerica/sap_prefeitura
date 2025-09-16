import SequelizeLib from "sequelize";
import { DATABASE_URL } from "../config/env.js";

const Sequelize = new SequelizeLib(DATABASE_URL);

Sequelize.authenticate()
  .then(() => {
    console.log("✅ Conectado ao banco de dados");
  })
  .catch((err) => {
    console.log(`Sem sucesso na conexão com o banco de dados: ${err}`);
  });

// Para sincronizar modelos sem excluir tabelas existentes:
// Sequelize.sync({ alter: true })
//   .then(() => {
//     console.log("Modelos sincronizados com sucesso!");
//   })
//   .catch((err) => {
//     console.error("Erro ao sincronizar modelos:", err);
//   });

export default Sequelize;
