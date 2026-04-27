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
    visibility: boolean;
  }

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  const ServiceVisibilities = sequelize.define(
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
      },
      service_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
    }
  );

  return ServiceVisibilities;
};
