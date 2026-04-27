"use strict";

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.rawSelect(
      "setors",
      {
        where: { id: 1 },
      },
      ["id"]
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

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("setors", { id: 1 });
  },
};
