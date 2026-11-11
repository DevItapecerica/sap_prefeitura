import { QueryInterface } from "sequelize";
import { seedPermissionCatalog } from "./helpers/bootstrap-catalog.js";

export default {
  async up(query: QueryInterface): Promise<void> {
    await query.sequelize.transaction((transaction) =>
      seedPermissionCatalog(query, transaction),
    );
  },
  async down(): Promise<void> {
    throw new Error(
      "Seed rollback refused: permission actions and grants must be preserved.",
    );
  },
};
