import { DataTypes, Sequelize } from "sequelize";

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const Pagador = sequelize.define("Pagador", {
    edital_id: { type: dataTypes.UUID, allowNull: true },
    uuid: { type: dataTypes.UUID, defaultValue: dataTypes.UUIDV4, primaryKey: true },
    nome: {
      type: dataTypes.STRING,
      allowNull: false,
      set(value: string) { this.setDataValue("nome", value.trim().replace(/\s+/g, " ")); },
    },
    quantidade: { type: dataTypes.INTEGER.UNSIGNED, allowNull: false, validate: { min: 0 } },
  }, {
    tableName: "pagadores",
    timestamps: true,
    paranoid: true,
  });

  (Pagador as any).associate = (models: any) => {
    Pagador.hasMany(models.BolsistasEdital, { foreignKey: "pagador_id", as: "vinculos" });
  };
  return Pagador;
};
