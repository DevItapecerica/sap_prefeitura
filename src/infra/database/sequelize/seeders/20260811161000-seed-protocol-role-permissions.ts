import { QueryInterface, QueryTypes } from "sequelize";

type Role = { id: number; name: string };

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => queryInterface.sequelize.transaction(async (transaction) => {
    const roles = await queryInterface.sequelize.query<Role>("SELECT id, name FROM roles ORDER BY id", { type: QueryTypes.SELECT, transaction });
    const now = new Date();
    for (const role of roles) {
      const exists = await queryInterface.rawSelect("protocol_role_permissions", { where: { role_id: role.id }, transaction }, "id");
      if (exists) continue;
      const admin = role.id === 1 || role.name.toLowerCase() === "admin";
      await queryInterface.bulkInsert("protocol_role_permissions", [{
        role_id: role.id,
        manage_catalog: admin,
        triage: admin,
        route: admin,
        decide: admin,
        view_sector: admin,
        export: admin,
        manage_privacy: admin,
        view_restricted: admin,
        view_operations: admin,
        created_at: now,
        updated_at: now,
      }], { transaction });
    }
  }),
  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.bulkDelete("protocol_role_permissions", {});
  },
};
