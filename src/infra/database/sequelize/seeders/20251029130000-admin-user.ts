import { hash } from "bcryptjs";
import { QueryInterface } from "sequelize";

const DEFAULT_ADMIN_EMAIL = "admin@admin.com";
const DEFAULT_ADMIN_PASSWORD = "admin";

export const getBootstrapCredentials = (env: NodeJS.ProcessEnv) => {
  const production = env.NODE_ENV === "production";
  const email = env.BOOTSTRAP_ADMIN_EMAIL?.trim();
  const password = env.BOOTSTRAP_ADMIN_PASSWORD;

  if (production && (!email || !password)) {
    throw new Error(
      "BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD are required to create the first production administrator",
    );
  }

  return {
    email: email || DEFAULT_ADMIN_EMAIL,
    password: password || DEFAULT_ADMIN_PASSWORD,
  };
};

export const runAdminSeed = async (
  queryInterface: QueryInterface,
  env: NodeJS.ProcessEnv,
): Promise<void> => {
  await queryInterface.sequelize.transaction(async (transaction) => {
    const adminRoleId = await queryInterface.rawSelect(
      "roles",
      { where: { name: "admin" }, transaction },
      "id",
    );

    if (!adminRoleId) {
      throw new Error("Admin role must be seeded before the bootstrap administrator");
    }

    const existingAdmin = await queryInterface.rawSelect(
      "users",
      { where: { role_id: Number(adminRoleId), deletedAt: null }, transaction },
      "id",
    );

    if (existingAdmin) return;

    const setorId = await queryInterface.rawSelect(
      "setors",
      { where: { name: "tecnologia" }, transaction },
      "id",
    );

    if (!setorId) {
      throw new Error("Technology setor must be seeded before the bootstrap administrator");
    }

    const credentials = getBootstrapCredentials(env);
    await queryInterface.bulkInsert("users", [{
      name: "admin",
      email: credentials.email,
      ramal: "0000",
      password: await hash(credentials.password, 10),
      setor_id: Number(setorId),
      firstLogin: true,
      role_id: Number(adminRoleId),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }], { transaction });
  });
};

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await runAdminSeed(queryInterface, process.env);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim() || DEFAULT_ADMIN_EMAIL;
    await queryInterface.bulkDelete("users", { email });
  },
};
