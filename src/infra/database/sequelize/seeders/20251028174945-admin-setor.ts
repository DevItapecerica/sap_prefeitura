import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const existing = await queryInterface.rawSelect(
      "setors",
      {
        where: { id: 1 },
      },
      "id",
    );

    if (!existing) {
      await queryInterface.bulkInsert("setors", [
        {
          id: 1,
          name: "tecnologia",
          description: "Gerenciamento de sistemas",
        },
      ]);
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.bulkDelete("setors", { id: 1 });
  },
};
