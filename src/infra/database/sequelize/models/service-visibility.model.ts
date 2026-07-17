import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Sequelize,
  DataTypes,
} from "sequelize";

// ─── Classe do modelo ────────────────────────────────────────────

export interface ServiceVisibilitiesDB
  extends Model<
    InferAttributes<ServiceVisibilitiesDB>,
    InferCreationAttributes<ServiceVisibilitiesDB>
  > {
    id: CreationOptional<number>;
    setor_id: number;
    service_id: number;
    visibility: CreationOptional<boolean | null>;
  }

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const ServiceVisibilities = sequelize.define<ServiceVisibilitiesDB>(
    "ServiceVisibilities",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      setor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "setors",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      service_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "services",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      visibility: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
    },
    {
      timestamps: false,
      tableName: "service_visibilities",
    },
  );

  (ServiceVisibilities as any).associate = (models: any) => {
    ServiceVisibilities.belongsTo(models.SetorModel, {
      foreignKey: "setor_id",
      as: "setor",
    });
    ServiceVisibilities.belongsTo(models.ServiceModel, {
      foreignKey: "service_id",
      as: "service",
    });
  };

  return ServiceVisibilities;
};
