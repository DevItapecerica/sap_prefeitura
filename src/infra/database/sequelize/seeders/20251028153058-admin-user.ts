import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const existing = await queryInterface.rawSelect(
      "users",
      { where: { email: "admin@admin.com" } },
      "id",
    );

    if (!existing || existing === null) {
      await queryInterface.bulkInsert("users", [
        {
          name: "admin",
          email: "admin@admin.com",
          ramal: "0000",
          password:
            "$2b$10$w8N0Uh0uIb1cKkxK9tZU2OmTQ1ySE1PIx1e7h/AOH6p8L68LSCrN2",
          setor_id: 1,
          firstLogin: true,
          role_id: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ]);
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.bulkDelete("users", { email: "admin@admin.com" });
  },
};
