import { QueryInterface } from "sequelize";

const CHAMADOS_SERVICE_ID = 8;

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete(
        "service_visibilities",
        { service_id: CHAMADOS_SERVICE_ID },
        { transaction },
      );
      await queryInterface.bulkDelete(
        "permissions",
        { service_id: CHAMADOS_SERVICE_ID },
        { transaction },
      );
      await queryInterface.bulkDelete(
        "services",
        { id: CHAMADOS_SERVICE_ID },
        { transaction },
      );
    });
  },

  // O recurso foi aposentado de forma permanente; desfazer a seed não o recria.
  down: async (): Promise<void> => {},
};
