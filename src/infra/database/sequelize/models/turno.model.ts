import { DataTypes, Sequelize } from "sequelize";

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const Turno = sequelize.define("Turno", {
    edital_id: { type: dataTypes.UUID, allowNull: true },
    uuid: { type: dataTypes.UUID, defaultValue: dataTypes.UUIDV4, primaryKey: true },
    nome: {
      type: dataTypes.STRING,
      allowNull: false,
      set(value: string) { this.setDataValue("nome", value.trim().replace(/\s+/g, " ")); },
    },
    hora_inicio: { type: dataTypes.TIME, allowNull: false },
    hora_fim: { type: dataTypes.TIME, allowNull: false },
  }, { tableName: "turnos", timestamps: true, paranoid: true });

  (Turno as any).associate = (models: any) => {
    Turno.hasMany(models.BolsistasEdital, { foreignKey: "turno_id", as: "vinculos" });
  };
  return Turno;
};
