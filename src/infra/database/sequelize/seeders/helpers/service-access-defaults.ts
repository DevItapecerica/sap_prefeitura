import { QueryInterface, QueryTypes, Transaction } from "sequelize";

type RoleRow = {
  id: number;
  name: string;
};

type SetorRow = {
  id: number;
};

type EnsureServiceAccessDefaultsOptions = {
  transaction?: Transaction;
};

const isAdminRole = (role: RoleRow) =>
  role.id === 1 || role.name.toLowerCase() === "admin";

export const ensureServiceAccessDefaultsForSeed = async (
  queryInterface: QueryInterface,
  serviceId: number,
  options: EnsureServiceAccessDefaultsOptions = {},
): Promise<void> => {
  const now = new Date();
  const { transaction } = options;

  const roles = await queryInterface.sequelize.query<RoleRow>(
    "SELECT id, name FROM roles ORDER BY id",
    { type: QueryTypes.SELECT, transaction },
  );

  for (const role of roles) {
    const permissionExists = await queryInterface.rawSelect(
      "permissions",
      {
        where: {
          role_id: role.id,
          service_id: serviceId,
        },
        transaction,
      },
      "id",
    );

    if (permissionExists) continue;

    const allowed = isAdminRole(role) ? 1 : 0;

    await queryInterface.bulkInsert(
      "permissions",
      [
        {
          role_id: role.id,
          service_id: serviceId,
          read: allowed,
          write: allowed,
          edit: allowed,
          del: allowed,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ],
      { transaction },
    );
  }

  const setores = await queryInterface.sequelize.query<SetorRow>(
    "SELECT id FROM setors ORDER BY id",
    { type: QueryTypes.SELECT, transaction },
  );

  for (const setor of setores) {
    const visibilityExists = await queryInterface.rawSelect(
      "service_visibilities",
      {
        where: {
          setor_id: setor.id,
          service_id: serviceId,
        },
        transaction,
      },
      "id",
    );

    if (visibilityExists) continue;

    await queryInterface.bulkInsert(
      "service_visibilities",
      [
        {
          setor_id: setor.id,
          service_id: serviceId,
          visibility: setor.id === 1 ? 1 : 0,
        },
      ],
      { transaction },
    );
  }
};
