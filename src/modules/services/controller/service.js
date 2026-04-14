import { Op } from "sequelize";
import db from "../db/models/index.js";

export const getAll = async () => {
  return await db.Services.findAll();
};

export const getOne = async (id) => {
  return await db.Services.findOne({ where: { id } });
};

export const create = async (service) => {
  const newService = await db.Services.create(service);
  return newService;
};

export const deleteOne = async (id) => {
  const deletedCount = await db.Services.destroy({ where: { id } });
  return deletedCount;
};

export const update = async (id, service) => {
  const [updatedCount] = await db.Services.update(service, { where: { id } });
  return updatedCount;
};
