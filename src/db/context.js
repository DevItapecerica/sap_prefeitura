const sequelize = require('sequelize');

const {DATABASE_USER, DATABASE_KEY, DATABASE_HOST, DATABASE_NAME} = require('../config/env');

const DUser = DATABASE_USER;
const DKey = DATABASE_KEY;
const DName = DATABASE_NAME;
const DHost = DATABASE_HOST;

const Sequelize = new sequelize(DName, DUser, DKey, {
  host: DHost,
  dialect: "mariadb",
  define: {
    timestamps: false,
  },
});

Sequelize.authenticate()
  .then(() => {
    console.log("conectado ao banco de dados");
  })
  .catch((err) => {

    console.log(`Sem sucesso na conexão com o banco de dados ${err} `);
  });

// // Sincronizar modelos sem excluir tabelas existentes
//  Sequelize.sync({ alter: true })
//  .then(() => {
//      console.log("Modelos sincronizados com sucesso!");
//  })
//  .catch((err) => {
//      console.error("Erro ao sincronizar modelos:", err);
//  });

module.exports = Sequelize;