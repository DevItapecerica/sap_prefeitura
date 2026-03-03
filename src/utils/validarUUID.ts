import db from "../db/models/index.js";

const ValidarUUID = async (uuid: string, model: string) => {
    const validUUID = await db[model].findByPk(uuid);

    if (validUUID === null || validUUID === undefined) {
      return false;
    }

    return true;
};

export default ValidarUUID;
