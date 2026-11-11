import { QueryInterface } from "sequelize";

const TABLE = "users";
const EMAIL_INDEX = "idx_users_email";
const UNIQUE_EMAIL_INDEX = "unique_users_email";

type IndexDescription = {
  name: string;
  primary: boolean;
  unique: boolean;
  fields: Array<{ attribute: string }>;
};

const getIndexes = async (queryInterface: QueryInterface) =>
  (await queryInterface.showIndex(TABLE)) as unknown as IndexDescription[];

const isEmailOnlyIndex = (index: IndexDescription) =>
  index.fields.length === 1 && index.fields[0]?.attribute === "email";

const ensureRegularEmailIndex = async (queryInterface: QueryInterface) => {
  const indexes = await getIndexes(queryInterface);
  const existing = indexes.find((index) => index.name === EMAIL_INDEX);

  if (existing && !existing.unique && isEmailOnlyIndex(existing)) return;

  await queryInterface.addIndex(TABLE, ["email"], {
    name: EMAIL_INDEX,
  });
};

const removeUniqueEmailIndexes = async (queryInterface: QueryInterface) => {
  const indexes = await getIndexes(queryInterface);

  for (const index of indexes) {
    if (!index.primary && index.unique && isEmailOnlyIndex(index)) {
      await queryInterface.removeIndex(TABLE, index.name);
    }
  }
};

/** @type {import("sequelize-cli").Migration} */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await ensureRegularEmailIndex(queryInterface);
    await removeUniqueEmailIndexes(queryInterface);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const indexes = await getIndexes(queryInterface);

    if (indexes.some((index) => index.name === EMAIL_INDEX)) {
      await queryInterface.removeIndex(TABLE, EMAIL_INDEX);
    }

    const remainingIndexes = await getIndexes(queryInterface);
    const alreadyUnique = remainingIndexes.some(
      (index) => index.unique && isEmailOnlyIndex(index),
    );

    if (!alreadyUnique) {
      await queryInterface.addIndex(TABLE, ["email"], {
        name: UNIQUE_EMAIL_INDEX,
        unique: true,
      });
    }
  },
};
