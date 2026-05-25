import { Op } from "sequelize";
import { QueryParams } from "../../../../core/types/genericTypes.js";
import {
  userParams,
  userRequired,
} from "../../../../modules/user/application/dto/user.dto.js";

import UserRepository from "../../../../modules/user/domain/repository/user.repository.js";
import db from "../index.js";
import { User } from "../../../../modules/user/domain/entity/User.js";

export class SequelizeUserRepository implements UserRepository {
  private model = db.UserModel;

  createUser = async (user: userRequired, password: string): Promise<User> => {
    const payload = {
      name: user.name,
      email: user.email,
      ramal: user.ramal,
      password: password,
      setor_id: user.setor_id,
      firstLogin: true,
      role_id: user.role_id,
    };

    const newUser = await this.model.create(payload);

    return this.toEntity(newUser);
  };

  getUserById = async (id: userParams): Promise<User | null> => {
    const user = await this.model.findByPk(id);
    return user ? this.toEntity(user) : null;
  };

  getAllUser = async (
    query: QueryParams,
  ): Promise<{ user: User[]; count: number }> => {
    const { page, limit, search, order, setorId } = query;
    const queryOrder = order ? order.split(":") : ["id", "desc"];

    const offset = limit ? Number(page) * Number(limit) : undefined;

    const searchWhere = search
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const setorWhere = setorId ? { setor_id: setorId } : {};
    const where = { ...searchWhere, ...setorWhere };

    const user = await this.model.findAll({
      offset,
      where,
      limit: limit,
      order: [[queryOrder[0], queryOrder[1]]],
    });

    const count = await this.model.count({
      where,
    });

    return {
      user: user.map((item: any) => this.toEntity(item)),
      count,
    };
  };

  updateUser = async (
    id: userParams,
    data: userRequired,
  ): Promise<User> => {
    const payload = {
      name: data.name,
      email: data.email,
      ramal: data.ramal,
      setor_id: data.setor_id,
      firstLogin: true,
      role_id: data.role_id,
    };

    const user = await this.model.findByPk(id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      throw new Error("User not found");
    }

    await user.update(payload);

    return this.toEntity(user);
  };

  deleteUser = async (id: userParams): Promise<boolean> => {
    const deleted = await this.model.destroy({ where: { id } });

    return deleted > 0;
  };

  deleteUserBySetor = async (setorId: number): Promise<boolean> => {
    const deleted = await this.model.destroy({ where: { setor_id: setorId } });
    return deleted > 0;
  };

  alterarUserSenha = async (id: number, password: string): Promise<boolean> => {
    await this.model.update({ password }, { where: { id } });
    return true;
  };

  getUserByEmail = async (
    email: string,
    excludeId?: userParams,
  ): Promise<User | null> => {
    const where = excludeId ? { email, id: { [Op.ne]: excludeId } } : { email };
    const user = await this.model.findOne({ where });

    if (!user) return null;

    return this.toEntity(user);
  };

  // 🔥 mapper (ESSENCIAL)
  private toEntity(data: any): User {
    return new User(
      data.name,
      data.email,
      data.ramal,
      data.setor_id,
      data.role_id,

      data.id,
      data.firstLogin,
      data.password,
      data.createdAt,
      data.updatedAt,
      data.deletedAt,
    );
  }
}
