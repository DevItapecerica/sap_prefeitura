import { hash } from "bcryptjs";
import { QueryInterface, QueryTypes } from "sequelize";

export function getBootstrapCredentials(env: NodeJS.ProcessEnv): {
  email: string;
  password: string;
} {
  const email = env.BOOTSTRAP_ADMIN_EMAIL?.trim();
  const password = env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || !password)
    throw new Error(
      "BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD are required to create the first administrator",
    );
  return { email, password };
}

export async function runAdminSeed(
  query: QueryInterface,
  env: NodeJS.ProcessEnv,
): Promise<void> {
  await query.sequelize.transaction(async (transaction) => {
    // Serialize bootstrap attempts using the stable role ID, never the role's display name.
    const [role] = await query.sequelize.query<{ id: number }>(
      "SELECT id FROM roles WHERE id=1 FOR UPDATE",
      { type: QueryTypes.SELECT, transaction },
    );
    if (!role)
      throw new Error("Seed administrator role before the bootstrap account");
    const existing = await query.rawSelect(
      "users",
      { where: { role_id: 1, deletedAt: null }, transaction },
      "id",
    );
    if (existing) return;
    const setor = await query.rawSelect(
      "setors",
      { where: { id: 1 }, transaction },
      "id",
    );
    if (!setor)
      throw new Error("Seed technology sector before the bootstrap account");
    const credentials = getBootstrapCredentials(env);
    const duplicate = await query.rawSelect(
      "users",
      { where: { email: credentials.email, deletedAt: null }, transaction },
      "id",
    );
    if (duplicate)
      throw new Error(
        "Bootstrap email is already associated with an active account",
      );
    const actions = await query.sequelize.query<{ id: number }>(
      "SELECT id FROM permission_actions ORDER BY id",
      { type: QueryTypes.SELECT, transaction },
    );
    if (!actions.length)
      throw new Error("Seed permission actions before the bootstrap account");
    const now = new Date();
    await query.bulkInsert(
      "users",
      [
        {
          name: "admin",
          email: credentials.email,
          password: await hash(credentials.password, 10),
          ramal: "0000",
          role_id: 1,
          setor_id: 1,
          firstLogin: true,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ],
      { transaction },
    );
    const current = await query.sequelize.query<{
      permission_action_id: number;
    }>("SELECT permission_action_id FROM role_permissions WHERE role_id=1", {
      type: QueryTypes.SELECT,
      transaction,
    });
    const existingActions = new Set(
      current.map((grant) => grant.permission_action_id),
    );
    const initialGrants = actions.filter(
      (action) => !existingActions.has(action.id),
    );
    if (initialGrants.length)
      await query.bulkInsert(
        "role_permissions",
        initialGrants.map((action) => ({
          role_id: 1,
          permission_action_id: action.id,
          allowed: true,
          createdAt: now,
          updatedAt: now,
        })),
        { transaction },
      );
  });
}

export default {
  async up(query: QueryInterface): Promise<void> {
    await runAdminSeed(query, process.env);
  },
  async down(): Promise<void> {
    throw new Error(
      "Seed rollback refused: bootstrap accounts and access grants must be preserved.",
    );
  },
};
