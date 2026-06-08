import { DataTypes, Sequelize } from "sequelize";

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const Image = sequelize.define(
    "Image",
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true,
      },
      bolsista_id: {
        type: dataTypes.UUID,
        allowNull: false,
        references: {
          model: "bolsistas",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      type_id: {
        type: dataTypes.INTEGER,
        allowNull: false,
      },
      path: {
        type: dataTypes.STRING,
        allowNull: false,
      },
      mime: {
        type: dataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "bolsista_image",
      timestamps: true,
      paranoid: true,
    },
  );

  (Image as any).associate = (models: any) => {
    Image.belongsTo(models.Bolsistas, {
      foreignKey: "bolsista_id",
      as: "bolsista",
      onDelete: "CASCADE",
    });
  };

  return Image;
};
