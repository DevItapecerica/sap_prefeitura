import { DataTypes, QueryInterface, literal } from "sequelize";

const UUID_BIN_TYPE = "CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin";

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tables = await queryInterface.showAllTables();
      if (!tables.includes("bolsista_ocorrencias")) await queryInterface.createTable("bolsista_ocorrencias", {
      id: { type: UUID_BIN_TYPE, defaultValue: literal("UUID()"), primaryKey: true, allowNull: false },
      bolsista_edital_id: {
        type: UUID_BIN_TYPE,
        allowNull: false,
        references: { model: "bolsistas_edital", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      data_ocorrencia: { type: DataTypes.DATEONLY, allowNull: false },
      descricao: { type: DataTypes.TEXT, allowNull: false },
      author_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: literal("CURRENT_TIMESTAMP") },
      deletedAt: { type: DataTypes.DATE, allowNull: true },
      }, { transaction });
      const indexes = await queryInterface.showIndex("bolsista_ocorrencias") as any[];
      if (!indexes.some((index) => index.name === "idx_bolsista_ocorrencias_vinculo")) {
        await queryInterface.addIndex("bolsista_ocorrencias", ["bolsista_edital_id"], { name: "idx_bolsista_ocorrencias_vinculo", transaction });
      }
      if (!indexes.some((index) => index.name === "idx_bolsista_ocorrencias_data")) {
        await queryInterface.addIndex("bolsista_ocorrencias", ["data_ocorrencia"], { name: "idx_bolsista_ocorrencias_data", transaction });
      }
    });
  },
  async down(queryInterface: QueryInterface) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes("bolsista_ocorrencias")) await queryInterface.dropTable("bolsista_ocorrencias");
  },
};
