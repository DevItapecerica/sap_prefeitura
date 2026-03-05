import { Op } from "sequelize";
import db from "../../db/db.js";
import { QueryParams } from "../../types/genericTypes.js";
import { userParams, userRequired, userResponse, userResponseAll } from "./types.js";

export default class UserRepository {
  create = async (user: userRequired, password: string): Promise<userResponse> => {
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

  getById = async (id: userParams): Promise<userResponse> => {
    const user = await db.UserModel.findByPk(id);
    return user;
  };

  getAll = async (query: QueryParams): Promise<userResponseAll> => {
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

  update = async (id: userParams, data: userRequired): Promise<userResponse> => {
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

    await user.update(payload);
    
    return user;
  };

  delete = async (id: userParams): Promise<boolean> => {
    await db.UserModel.destroy({ where: { id } });

    return true
  };

  deleteBySetor = async (setorId: number): Promise<boolean> => {
    await db.UserModel.destroy({ where: { setor_id: setorId } });
    return true;
  };

  alterarSenha = async (id: number, password: string): Promise<boolean> => {
    await db.UserModel.update({ password }, { where: { id } })
    return true;
  };

  getByEmail = async (email: string, excludeId?: userParams): Promise<userResponse> => {
    const where = excludeId ? { email, id: { [Op.ne]: excludeId} } : { email };
    const user = await db.UserModel.findOne({ where});

    return user;
  };
}
