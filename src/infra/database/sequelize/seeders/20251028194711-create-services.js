"use strict";

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    const registros = [
      {
        id: 1,
        name: "User",
        description: "Documentação da aplicação",
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
        name: "Serviços",
        description: "Gerenciamento de serviços",
        url: "/services/3/admin?tab=2",
        tag: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        name: "Roles",
        description: "Gerenciamento de permissões",
        url: "/services/4/admin?tab=3",
        tag: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 5,
        name: "DemandasTi",
        description: "Gerenciamento de permissões",
        url: "/services/4/admin?tab=3",
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
        description: "Disponibilização de Certidão para Munícipe",
        url: "/services/7/iptu/certidao",
        tag: "outros",
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
        ["id"]
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
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("services", {
      id: [1, 2, 3, 4, 6, 7],
    });
  },
};
