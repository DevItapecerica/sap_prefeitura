import { QueryInterface, QueryTypes } from "sequelize";
import { bootstrapServices } from "./helpers/bootstrap-services.js";

export default {
  async up(query: QueryInterface): Promise<void> {
    await query.sequelize.transaction(async (transaction) => {
      const setor = await query.rawSelect(
        "setors",
        { where: { id: 1 }, transaction },
        "id",
      );
      if (!setor)
        await query.bulkInsert(
          "setors",
          [
            {
              id: 1,
              name: "tecnologia",
              description: "Gerenciamento de sistemas",
            },
          ],
          { transaction },
        );
      const roles = [
        { id: 1, name: "admin" },
        { id: 2, name: "tecnico" },
        { id: 3, name: "Gestor" },
        { id: 4, name: "Usuário" },
      ];
      for (const role of roles) {
        const exists = await query.rawSelect(
          "roles",
          { where: { id: role.id }, transaction },
          "id",
        );
        if (!exists) await query.bulkInsert("roles", [role], { transaction });
      }
      const now = new Date();
      for (const service of bootstrapServices) {
        const [existing] = await query.sequelize.query<{ module_key: string }>(
          "SELECT module_key FROM services WHERE id=:id",
          {
            type: QueryTypes.SELECT,
            replacements: { id: service.id },
            transaction,
          },
        );
        const existingModule = existing?.module_key;
        if (existingModule && existingModule !== service.module_key)
          throw new Error("Bootstrap service ID belongs to a different module");
        if (!existingModule)
          await query.bulkInsert(
            "services",
            [{ ...service, createdAt: now, updatedAt: now, deletedAt: null }],
            { transaction },
          );
        const visibility = await query.rawSelect(
          "service_visibilities",
          { where: { service_id: service.id, setor_id: 1 }, transaction },
          "id",
        );
        if (!visibility)
          await query.bulkInsert(
            "service_visibilities",
            [{ service_id: service.id, setor_id: 1, visibility: true }],
            { transaction },
          );
      }
      const control = await query.rawSelect(
        "ft_estoque_controle",
        { where: { id: 1 }, transaction },
        "id",
      );
      if (!control)
        await query.bulkInsert(
          "ft_estoque_controle",
          [{ id: 1, versao: 0, createdAt: now, updatedAt: now }],
          { transaction },
        );
    });
  },
  async down(): Promise<void> {
    throw new Error(
      "Seed rollback refused: system catalogs and their references must be preserved.",
    );
  },
};
