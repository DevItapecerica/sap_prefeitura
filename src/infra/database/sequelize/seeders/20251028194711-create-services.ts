import { QueryInterface } from "sequelize";
import { ensureServiceAccessDefaultsForSeed } from "./helpers/service-access-defaults.js";

type ServiceSeed = {
  id: number;
  name: string;
  description: string;
  url: string;
  tag: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const registros: ServiceSeed[] = [
      {
        id: 1,
        name: "User",
        description: "Gerenciamento de usuários",
        url: "/services/1/admin",
        tag: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: "Setor",
        description: "Gerenciamento de setores",
        url: "/services/2/admin?tab=1",
        tag: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        name: "Servicos",
        description: "Gerenciamento de servicos",
        url: "/services/3/admin?tab=2",
        tag: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        name: "Roles",
        description: "Gerenciamento de permissoes",
        url: "/services/4/admin?tab=3",
        tag: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 5,
        name: "DemandasTi",
        description: "Gerenciamento de permissoes",
        url: "/services/5/admin?tab=3",
        tag: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      },
      {
        id: 6,
        name: "Frente de Trabalho",
        description: "ft-app",
        url: "/services/6/ft-app",
        tag: "FT-App",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 7,
        name: "IPTU - Certidao",
        description: "Disponibilizacao de Certidao para Municipe",
        url: "/services/7/iptu/certidao",
        tag: "outros",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 8,
        name: "Chamados",
        description: "Gerenciamento de chamados",
        url: "/services/8/chamados",
        tag: "TI",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const registro of registros) {
      const exists = await queryInterface.rawSelect(
        "services",
        {
          where: { id: registro.id },
        },
        "id",
      );

      if (!exists) {
        await queryInterface.bulkInsert("services", [
          {
            ...registro,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
      }

      await ensureServiceAccessDefaultsForSeed(queryInterface, registro.id);
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.bulkDelete("services", {
      id: [1, 2, 3, 4, 6, 7, 8],
    });
  },
};
