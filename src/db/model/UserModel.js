const Sequelize = require("sequelize");
const db = require("../context");

const User = db.define(
  "User",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: Sequelize.STRING(70),
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING(255),
      allowNull: false,
      unique: true,
    },
    ramal: {
      type: Sequelize.STRING(255),
      allowNull: true,
      unique: false,
      defaultValue: "null",
    },
    password: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    setor_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    role_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    firstLogin: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = User;
