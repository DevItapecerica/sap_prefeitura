import { Op } from "sequelize";
import db from "../../db/db.js";
import { QueryParams } from "../../types/genericTypes.js";
import { userParams, userRequired } from "../../types/userType.js";

export default class UserRepository {
  static create = async (user: userRequired, password: string) => {
    const payload = {
      name: user.name,
      email: user.email,
      ramal: user.ramal,
      password: password,
      setor_id: user.setor_id,
      firstLogin: user.firstLogin,
      role_id: user.role_id,
    };

    const newUser = await db.UserModel.create(payload);

    return newUser;
  };

  static getById = async (id: userParams) => {
    const user = await db.UserModel.findByPk(id);
    return user;
  };

  static getAll = async (query: QueryParams) => {
    const { page, limit, search, order } = query;
    const queryOrder = order ? order.split(":") : ["createdAt", "desc"];

    const offset = Number(page) * Number(limit);

    const where = search
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const user = await db.UserModel.findAll({
      offset,
      where,
      limit: Number(limit),
      order: [[queryOrder[0], queryOrder[1]]],
    });

    const count = await db.UserModel.count({
      where,
    });

    return {
      user,
      count,
    };
  };

  static update = async (id: userParams, data: userRequired) => {
    const payload = {
      name: data.name,
      email: data.email,
      ramal: data.ramal,
      setor_id: data.setor_id,
      firstLogin: data.firstLogin,
      role_id: data.role_id,
    };

    const user = await db.UserModel.findByPk(id, {
      attributes: { exclude: ["password"] },
    });

    user.update(payload);
    
    return user;
  };

  static delete = async (id: userParams) => {
    await db.UserModel.destroy({ where: { id } });

    return true
  };

  static deleteBySetor = async (setorId: number) => {
    return db.UserModel.destroy({ where: { setor_id: setorId } });
  };

  static alterarSenha = async (id: number, password: string) => {
    return db.UserModel.update({ password }, { where: { id } });
  };

  static getByEmail = async (email: string) => {
    const user = await db.UserModel.findOne({ where: { email } });

    return user;
  };
}
